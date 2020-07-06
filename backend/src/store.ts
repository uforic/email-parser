import { mailboxEmitter } from './events/EventEmitter';
import { DetectedLink } from './cmd/parse_message';
import { Context } from './context';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gmail_v1 } from 'googleapis';

export const state = {
    numberOfMessagesSeen: 0,
    numberOfMessagesDownloaded: 0,
    syncCompleted: false,
    results: [] as Array<{ messageId: string; results: Array<DetectedLink> }>,
};

mailboxEmitter.onMessagePageDownloaded((numMessages) => {
    state.numberOfMessagesSeen += numMessages;
});
mailboxEmitter.onMessageDownloaded(() => {
    state.numberOfMessagesDownloaded++;
});
mailboxEmitter.onSyncCompleted(() => {
    state.syncCompleted = true;
});

export const loadMessage = (context: Context, messageId: string): gmail_v1.Schema$Message => {
    return JSON.parse(readFileSync(join(context.env.cacheDirectory, messageId + '.json')).toString());
};

export const loadMetadata = (
    message: gmail_v1.Schema$Message,
): { subject: string; from: string; to: string; snippet: string } => {
    const headers = message.payload?.headers;
    const metadata = {
        subject: '',
        from: '',
        to: '',
        snippet: '',
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

const COMPLETED = 'completed';
const NOT_STARTED = 'not_started';
const IN_PROGRESS = 'in_progress';
const FAILED = 'failed';

export const DOWNLOAD_MESSAGE = 'downloadMessage';
export const SYNC_MAILBOX = 'syncMailbox';
export const ANALYZE_MESSAGE = 'analyzeMessage';

export type JobType = typeof DOWNLOAD_MESSAGE | typeof SYNC_MAILBOX | typeof ANALYZE_MESSAGE;

import { PrismaClient } from '@prisma/client';
import AsyncLock from 'async-lock';
const _prismaClient = new PrismaClient();

const prismaLock = new AsyncLock({ maxPending: 10000 });

const prismaClient = async <K>(fn: (prismaClient: PrismaClient) => Promise<K>) => {
    return await prismaLock.acquire('key', async () => {
        return await fn(_prismaClient);
    });
};

export const markJobComplete = async (jobId: number) => {
    await prismaClient(async (prismaClient) => {
        await prismaClient.job.update({ where: { id: jobId }, data: { status: COMPLETED } });
    });
};

export const markJobFailed = async (jobId: number) => {
    await prismaClient(async (prismaClient) => {
        return await prismaClient.job.update({ where: { id: jobId }, data: { status: FAILED } });
    });
};

export const markJobInProgress = async (jobId: number) => {
    await prismaClient(async (prismaClient) => {
        return await prismaClient.job.update({ where: { id: jobId }, data: { status: IN_PROGRESS } });
    });
};

export const resetAllJobs = async () => {
    await prismaClient(async (prismaClient) => {
        return await prismaClient.job.updateMany({ where: { status: IN_PROGRESS }, data: { status: 'not_started' } });
    });
};

export const getFreshJobAndMarkInProgress = async (jobType: JobType) => {
    return await prismaClient(async (prismaClient) => {
        const job = await prismaClient.job.findMany({
            where: {
                status: NOT_STARTED,
                type: jobType,
            },
            take: 1,
        });
        if (job.length === 0) {
            return null;
        }
        await prismaClient.job.update({ where: { id: job[0].id }, data: { status: 'in_progress' } });
        return job[0];
    });
};
export const getNumberOfCurrentlyRunningJobs = async (jobType: JobType) => {
    return await prismaClient(async (prismaClient) => {
        return await prismaClient.job.count({
            where: {
                status: IN_PROGRESS,
                type: jobType,
            },
        });
    });
};

export const addJob = async (userId: string, type: JobType, jobArgs: {}) => {
    await prismaClient(async (prismaClient) => {
        return await prismaClient.job.create({
            data: {
                args: JSON.stringify(jobArgs),
                type: type,
                status: NOT_STARTED,
                userId,
            },
        });
    });
};

export const storeResult = async (userId: string, messageId: string, type: string, data: {}) => {
    await prismaClient(async (prismaClient) => {
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

export const getPageOfResults = async (userId: string, previousToken?: string) => {
    return await prismaClient(async (prismaClient) => {
        return (
            await prismaClient.result.findMany({
                take: 5,
                orderBy: {
                    messageId: 'asc',
                },
                where: {
                    userId,
                },
            })
        ).map((result) => ({ ...result, data: JSON.parse(result.data) as DetectedLink }));
    });
};
