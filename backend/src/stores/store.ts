// @ts-ignore
import _sqlstring from 'sqlstring-sqlite';
import orginalSqlstring from 'sqlstring';
const sqlstring: typeof orginalSqlstring = _sqlstring;
import { JobStatus, AnalysisType, JobType } from '../graphql/__generated__/resolvers';
import { PrismaClient, Message } from '@prisma/client';
import AsyncLock from 'async-lock';
import { LinkAnalysisData, TrackerAnalysisData } from '../types';
import throttle from 'lodash.throttle';
import { log } from '../helpers/utils';
import { createServerContext } from '../context';

const _prismaClient = new PrismaClient();

const prismaLock = new AsyncLock({ maxPending: 10000 });

/**
 * SQLite can't handle multiple concurrent writes,
 * "SQLite is busy"
 *
 * So we need to have a single thread lock on DB access,
 * even though we can separate writes and reads by table.
 */
const JOB_LOCK = 'all_tables';
const RESULT_LOCK = 'all_tables';
export const SESSION_LOCK = 'all_tables';
const MESSAGE_LOCK = 'all_tables';

let waitTimeOnLocks = 0;
let numLockAcquires = 0;
let currentLocks = 0;

/**
 * This helper function creates a queue of args so that
 * we can perform batch database operations to reduce
 * the number of queries.
 *
 * For certain insert operations, we don't care about them
 * being performed immediately; we don't need to await them.
 *
 * This is for those operations.
 */
const batchDoer = <K>(batchFn: (args: Array<K>) => void) => {
    let queue: Array<K> = [];
    const debouncedFn = throttle(() => {
        const batch = queue;
        queue = [];
        batchFn(batch);
    }, 10);
    return (args: K) => {
        queue.push(args);
        debouncedFn();
    };
};

/**
 * Because prisma doesn't limit concurrent SQL connections,
 * we can do it ourselves, by using a lock library.
 *
 * Some operations, especially user facing ones, skip the queue.
 */
export const prismaClient = async <K>(
    lockNames: Array<string>,
    queryDescription: string,
    fn: (prismaClient: PrismaClient) => Promise<K>,
    skipQueue: boolean = false,
) => {
    const startTime = Date.now();
    currentLocks++;
    return await prismaLock.acquire(
        lockNames,
        async () => {
            currentLocks--;
            numLockAcquires += 1;
            log(
                createServerContext(),
                'trace',
                'Lock acquired for',
                queryDescription,
                'average wait time per lock:',
                Math.round(waitTimeOnLocks / numLockAcquires),
                currentLocks,
            );
            waitTimeOnLocks += Date.now() - startTime;
            return await fn(_prismaClient);
        },
        {
            skipQueue,
        },
    );
};

export const getIntDate = () => Math.round(Date.now() / 1000);

export const getMostRecentMailboxSyncJob = async (userId: string) => {
    return (
        await prismaClient(
            [JOB_LOCK],
            'getMostRecentMailboxSyncJob',
            async (prismaClient) => {
                return await prismaClient.job.findMany({
                    where: {
                        type: JobType.SyncMailbox,
                        userId,
                    },
                    take: 1,
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
            },
            true,
        )
    )[0];
};

const _markJobCompleteBatch = async (args: Array<{ jobId: number }>) => {
    await prismaClient([JOB_LOCK], 'markJobComplete', async (prismaClient) => {
        await prismaClient.job.updateMany({
            where: { id: { in: args.map((arg) => arg.jobId) } },
            data: { status: JobStatus.Completed, updatedAt: getIntDate() },
        });
    });
};

export const markJobComplete = batchDoer(_markJobCompleteBatch);

export const markJobFailed = async (jobId: number) => {
    await prismaClient([JOB_LOCK], 'markJobFailed', async (prismaClient) => {
        return await prismaClient.job.update({
            where: { id: jobId },
            data: { status: JobStatus.Failed, updatedAt: getIntDate() },
        });
    });
};

export const markJobInProgress = async (jobId: number) => {
    await prismaClient([JOB_LOCK], 'markJobInProgress', async (prismaClient) => {
        return await prismaClient.job.update({
            where: { id: jobId },
            data: { status: JobStatus.InProgress, updatedAt: getIntDate() },
        });
    });
};

export const resetAllJobs = async () => {
    await prismaClient([JOB_LOCK], 'resetAllJobs', async (prismaClient) => {
        return await prismaClient.job.updateMany({
            where: { status: JobStatus.InProgress },
            data: { status: JobStatus.NotStarted, updatedAt: getIntDate() },
        });
    });
};

export const clearPendingJobsForUser = async (userId: string, parentId: number) => {
    await prismaClient([JOB_LOCK], 'clearPendingJobsForUser', async (prismaClient) => {
        return await prismaClient.job.updateMany({
            where: { status: JobStatus.InProgress, userId, parentId },
            data: { status: JobStatus.Failed, updatedAt: getIntDate() },
        });
    });
};

const INITIAL_COUNTS_QUERY = `SELECT parentId, type, COUNT(*) as cnt FROM job WHERE status='NOT_STARTED' AND parentId IS NOT NULL GROUP BY parentId, type;`;
export const getInitialJobCounts = async (): Promise<Array<{ parentId: number; cnt: number; type: JobType }>> => {
    return await prismaClient([JOB_LOCK], 'getInitialJobCounts', async (prismaClient) => {
        return await prismaClient.queryRaw(INITIAL_COUNTS_QUERY);
    });
};

/**
 * This should be an upsert operation... but you can't use updateMany and take in
 * the same operation, so we break it into two.
 *
 * Because we are only running one db operation at a time, this is OK.
 */
export const getFreshJobAndMarkInProgress = async <K>(jobType: JobType, take: number) => {
    return await prismaClient([JOB_LOCK], 'getFreshJobAndMarkInProgress', async (prismaClient) => {
        const jobs = await prismaClient.job.findMany({
            where: {
                status: JobStatus.NotStarted,
                type: jobType,
            },
            take,
        });
        await prismaClient.job.updateMany({
            where: {
                id: {
                    in: jobs.map((job) => job.id),
                },
            },
            data: { status: JobStatus.InProgress, updatedAt: getIntDate() },
        });
        return jobs.map((job) => ({ ...job, jobArgs: JSON.parse(job.args) as K }));
    });
};

export const addJobs = async (jobs: Array<{ userId: string; type: JobType; jobArgs: {}; parentId: number | null }>) => {
    await prismaClient([JOB_LOCK], 'addJobs', async (prismaClient) => {
        const createdDate = getIntDate();
        const jobList = jobs
            .map((job) => {
                return `('${JSON.stringify(job.jobArgs)}', ${sqlstring.escape(job.type)}, ${sqlstring.escape(
                    JobStatus.NotStarted,
                )}, ${sqlstring.escape(job.userId)}, ${createdDate}, ${createdDate}, ${job.parentId})`;
            })
            .join(',');

        const result: number = await prismaClient.executeRaw(`
            INSERT INTO job (args, type, status, userId, createdAt, updatedAt, parentId)
            VALUES 
                ${jobList}
            ;
        `);
        return result;
    });
};

const _storeMessageMetaBatch = async (
    messages: Array<{ messageId: string; subject: string; to: string; from: string }>,
) => {
    await prismaClient([MESSAGE_LOCK], 'storeMessageMetaBatch', async (prismaClient) => {
        const messageIds = messages.map((message) => message.messageId);
        const existingMessages = (
            await prismaClient.message.findMany({
                where: {
                    messageId: { in: messageIds },
                },
                select: {
                    messageId: true,
                },
            })
        ).map((message) => message.messageId);

        const newMessages = messages.filter((message) => !existingMessages.includes(message.messageId));
        if (newMessages.length <= 0) {
            return;
        }
        const createdDate = getIntDate();
        const newMessageList = newMessages
            .map((newMessage) => {
                return `('${newMessage.messageId}', ${sqlstring.escape(newMessage.subject)}, ${sqlstring.escape(
                    newMessage.from,
                )}, ${sqlstring.escape(newMessage.to)}, ${createdDate})`;
            })
            .join(',');

        const query = `
            INSERT INTO message (messageId, subject, 'from', 'to', createdAt)
            VALUES 
                ${newMessageList}
            ;
        `;

        const result: number = await prismaClient.executeRaw(query);
        return result;
    });
};

export const storeMessageMeta = batchDoer(_storeMessageMetaBatch);

export const storeResult = async (userId: string, messageId: string, type: string, data: {}) => {
    await prismaClient([RESULT_LOCK], 'storeResult', async (prismaClient) => {
        const previousMessage = (
            await prismaClient.result.findMany({
                where: {
                    type,
                    messageId,
                    userId,
                },
            })
        )[0];
        if (previousMessage) {
            return await prismaClient.result.update({
                where: {
                    id: previousMessage.id,
                },
                data: {
                    data: JSON.stringify(data),
                },
            });
        }
        return await prismaClient.result.create({
            data: {
                data: JSON.stringify(data),
                type,
                messageId,
                userId,
            },
        });
    });
};

export const getPageOfResults = async (
    userId: string,
    pageSize: number,
    previousToken: number | undefined = undefined,
    analysisType: string | undefined = undefined,
) => {
    return await prismaClient([RESULT_LOCK], 'getPageOfResults', async (prismaClient) => {
        const _results = await prismaClient.result.findMany({
            take: pageSize + 1,
            orderBy: {
                id: 'asc',
            },
            where: {
                userId,
                type: analysisType || undefined,
            },
            cursor:
                previousToken != null
                    ? {
                          id: previousToken,
                      }
                    : undefined,
        });

        const messageDict: Record<string, Message> = (
            await prismaClient.message.findMany({
                where: { messageId: { in: _results.map((result) => result.messageId) } },
            })
        ).reduce((acc, elem) => {
            return { ...acc, [elem.messageId]: elem };
        }, {});

        const results = _results.map((result) => {
            const foundMessage = messageDict[result.messageId] as Message | undefined;
            if (result.type === AnalysisType.LinkAnalysis) {
                return {
                    ...result,
                    message: foundMessage,
                    type: result.type as typeof AnalysisType.LinkAnalysis,
                    data: JSON.parse(result.data) as LinkAnalysisData,
                };
            } else if (result.type === AnalysisType.TrackerAnalysis) {
                return {
                    ...result,
                    message: foundMessage,
                    type: result.type as typeof AnalysisType.TrackerAnalysis,
                    data: JSON.parse(result.data) as TrackerAnalysisData,
                };
            }
            throw new Error("Can't load unrecognized analysis type.");
        });

        return {
            results: results.slice(0, Math.max(pageSize, results.length - 1)),
            nextPageToken: results.length < pageSize + 1 ? undefined : results[results.length - 1].id,
        };
    });
};
