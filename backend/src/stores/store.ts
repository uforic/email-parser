import sqlstring from 'sqlstring';
import { JobStatus } from '../graphql/resolvers';
import { PrismaClient } from '@prisma/client';
import AsyncLock from 'async-lock';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../constants';
import { LinkAnalysisData, TrackerAnalysisData, SYNC_MAILBOX, JobType } from '../types';

const COMPLETED = JobStatus.Completed;
const NOT_STARTED = JobStatus.NotStarted;
const IN_PROGRESS = JobStatus.InProgress;
const FAILED = JobStatus.Failed;

const _prismaClient = new PrismaClient();

const prismaLock = new AsyncLock({ maxPending: 10000 });

const prismaClient = async <K>(
    lockNames: Array<string>,
    fn: (prismaClient: PrismaClient) => Promise<K>,
    skipQueue: boolean = false,
) => {
    return await prismaLock.acquire(
        lockNames,
        async () => {
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
const SESSION_LOCK = 'job';

const getIntDate = () => Math.round(Date.now() / 1000);

export const getSavedSessionByUser = async (userId: string) => {
    return (
        await prismaClient(
            [SESSION_LOCK],
            async (prismaClient) => {
                return await prismaClient.session.findMany({
                    where: {
                        userId,
                    },
                    take: 1,
                });
            },
            true,
        )
    )[0];
};

export const getSavedSession = async (sid: string) => {
    return (
        await prismaClient(
            [SESSION_LOCK],
            async (prismaClient) => {
                return await prismaClient.session.findMany({
                    where: {
                        sid,
                    },
                    take: 1,
                });
            },
            true,
        )
    )[0];
};

export const setSavedSession = async (sid: string, session: string, userId?: string | null) => {
    return await prismaClient(
        [SESSION_LOCK],
        async (prismaClient) => {
            const existingRecords = await prismaClient.session.findMany({
                where: { sid },
            });
            if (existingRecords.length > 0) {
                return await prismaClient.session.update({
                    where: { id: existingRecords[0].id },
                    data: {
                        session,
                        userId,
                    },
                });
            }
            return await prismaClient.session.create({
                data: {
                    sid,
                    session,
                    createdAt: getIntDate(),
                    userId,
                },
            });
        },
        true,
    );
};

export const destroySession = async (sid: string) => {
    return await prismaClient(
        [SESSION_LOCK],
        async (prismaClient) => {
            return await prismaClient.session.deleteMany({
                where: {
                    sid,
                },
            });
        },
        true,
    );
};

export const getMostRecentMailboxSyncJob = async (userId: string) => {
    return (
        await prismaClient(
            [JOB_LOCK],
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

export const markJobComplete = async (jobId: number) => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        await prismaClient.job.update({
            where: { id: jobId },
            data: { status: COMPLETED, updatedAt: getIntDate() },
        });
    });
};

export const markJobFailed = async (jobId: number) => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        return await prismaClient.job.update({
            where: { id: jobId },
            data: { status: FAILED, updatedAt: getIntDate() },
        });
    });
};

export const markJobInProgress = async (jobId: number) => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        return await prismaClient.job.update({
            where: { id: jobId },
            data: { status: IN_PROGRESS, updatedAt: getIntDate() },
        });
    });
};

export const resetAllJobs = async () => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        return await prismaClient.job.updateMany({
            where: { status: IN_PROGRESS },
            data: { status: JobStatus.NotStarted, updatedAt: getIntDate() },
        });
    });
};

export const clearPendingJobsForUser = async (userId: string, parentJobId: number) => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        return await prismaClient.job.updateMany({
            where: { status: { in: [JobStatus.NotStarted] }, userId, parentId: parentJobId },
            data: { status: JobStatus.Failed, updatedAt: getIntDate() },
        });
    });
};

export const getFreshJobAndMarkInProgress = async (jobType: JobType, take: number) => {
    return await prismaClient([JOB_LOCK], async (prismaClient) => {
        const jobs = await prismaClient.job.findMany({
            where: {
                status: NOT_STARTED,
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
            data: { status: IN_PROGRESS, updatedAt: getIntDate() },
        });
        return jobs;
    });
};

export const addJobs = async (jobs: Array<{ userId: string; type: JobType; jobArgs: {}; parentId: number | null }>) => {
    await prismaClient([JOB_LOCK], async (prismaClient) => {
        const createdDate = getIntDate();
        const jobList = jobs
            .map((job) => {
                return `('${JSON.stringify(job.jobArgs)}', ${sqlstring.escape(job.type)}, ${sqlstring.escape(
                    NOT_STARTED,
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
    await prismaClient([RESULT_LOCK], async (prismaClient) => {
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
    return await prismaClient([RESULT_LOCK], async (prismaClient) => {
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
