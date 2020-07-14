import { Context } from '../context';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gmail_v1 } from 'googleapis';
import sqlstring from 'sqlstring';
import { JobStatus } from '../graphql/resolvers';
import { PrismaClient } from '@prisma/client';
import AsyncLock from 'async-lock';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../constants';
import { LinkAnalysisData, TrackerAnalysisData, SYNC_MAILBOX, JobType } from '../types';

export const loadMessage = (context: Context, messageId: string): gmail_v1.Schema$Message & { id: string } => {
    return {
        ...JSON.parse(readFileSync(join(context.env.cacheDirectory, messageId + '.json')).toString()),
        id: messageId,
    };
};

export const loadMetadata = (
    message: gmail_v1.Schema$Message & { id: string },
): { id: string; subject: string; from: string; to: string; snippet: string } => {
    const headers = message.payload?.headers;
    const metadata = {
        subject: '',
        from: '',
        to: '',
        snippet: '',
        id: message.id,
    };
    if (headers) {
        headers.forEach((header) => {
            if (header.name?.toLowerCase() === 'subject') {
                metadata.subject = header.value || '';
            }
            if (header.name?.toLowerCase() === 'from') {
                metadata.from = header.value || '';
            }
            if (header.name?.toLowerCase() === 'to') {
                metadata.to = header.value || '';
            }
        });
    }
    metadata.snippet = message.snippet || '';
    return metadata;
};

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

const JOB_LOCK = 'job';
const RESULT_LOCK = 'job';

const getIntDate = () => Math.round(Date.now() / 1000);

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
            data: { status: 'not_started', updatedAt: getIntDate() },
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
