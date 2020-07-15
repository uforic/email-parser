import sqlstring from 'sqlstring';
import { JobStatus } from '../graphql/resolvers';
import { PrismaClient, Session } from '@prisma/client';
import AsyncLock from 'async-lock';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../constants';
import { LinkAnalysisData, TrackerAnalysisData, SYNC_MAILBOX, JobType } from '../types';
import debounce from 'lodash.debounce';
import { log } from '../utils';
import { createContext } from '../context';

const _prismaClient = new PrismaClient();

const prismaLock = new AsyncLock({ maxPending: 10000 });

let waitTimeOnLocks = 0;
let numLockAcquires = 0;
let currentLocks = 0;

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
                createContext(),
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

/**
 * SQLite can't handle multiple concurrent writes,
 * "SQLite is busy"
 *
 * So we need to have a single thread lock on DB access,
 * even though we can separate writes and reads by table.
 */
const JOB_LOCK = 'job';
const RESULT_LOCK = 'job';
export const SESSION_LOCK = 'job';

export const getIntDate = () => Math.round(Date.now() / 1000);

export const getMostRecentMailboxSyncJob = async (userId: string) => {
    return (
        await prismaClient(
            [JOB_LOCK],
            'getMostRecentMailboxSyncJob',
            async (prismaClient) => {
                return await prismaClient.job.findMany({
                    where: {
                        type: SYNC_MAILBOX,
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

let jobsToMarkComplete: Array<number> = [];

export const markJobComplete = (jobId: number) => {
    jobsToMarkComplete.push(jobId);
    markJobCompleteBatch();
};

const _markJobCompleteBatch = async () => {
    await prismaClient([JOB_LOCK], 'markJobComplete', async (prismaClient) => {
        await prismaClient.job.updateMany({
            where: { id: { in: jobsToMarkComplete } },
            data: { status: JobStatus.Completed, updatedAt: getIntDate() },
        });
        jobsToMarkComplete = [];
    });
};

const markJobCompleteBatch = debounce(_markJobCompleteBatch, 10);

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

        const results = _results.map((result) => {
            if (result.type === LINK_ANALYSIS) {
                return {
                    ...result,
                    type: result.type as typeof LINK_ANALYSIS,
                    data: JSON.parse(result.data) as LinkAnalysisData,
                };
            } else if (result.type === TRACKER_ANALYSIS) {
                return {
                    ...result,
                    type: result.type as typeof TRACKER_ANALYSIS,
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
