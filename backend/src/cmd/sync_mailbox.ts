import { GmailContext } from '../context';
import { listMessages, getMessage } from '../clients/gmail';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assertDefined } from '../utils';
import { JobExecutor } from '../jobs/JobExecutor';
import { mailboxEmitter } from '../events/EventEmitter';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();
export const syncMailbox = async (
    context: GmailContext,
    userId: string,
    cacheDirectory: string,
    options: {
        // for debugging, if you want to only sync n messages
        maxPages?: number;
    },
) => {
    if (!existsSync(cacheDirectory)) {
        mkdirSync(cacheDirectory);
    }

    let pageCount = 0;

    const gmailGetExecutor = new JobExecutor<{ id: string }>(
        async ({ id }) => {
            const messagePath = join(cacheDirectory, id + '.json');
            if (existsSync(messagePath)) {
                mailboxEmitter.messageDownloaded(id);
                return;
            }
            const message = await getMessage(context, userId, id);
            writeFileSync(messagePath, JSON.stringify(message));
            mailboxEmitter.messageDownloaded(id);
        },
        { maxConcurrentJobs: 100 },
    );
    const gmailListExecutor = new JobExecutor<{ userId: string; pageToken?: string }>(async (args) => {
        const { messages, nextPageToken } = await listMessages(context, args.userId, args.pageToken);
        assertDefined(messages);
        pageCount += 1;
        messages.forEach(({ id }) => {
            assertDefined(id);
            prismaClient.job.create({
                data: { args: JSON.stringify({ messageId: id }), type: 'messageDownload' },
            });
            gmailGetExecutor.addJob({ id });
        });
        if (options.maxPages && pageCount >= options.maxPages) {
            mailboxEmitter.syncCompleted();
            return;
        }
        mailboxEmitter.messagePageDownloaded(messages.length);
        if (nextPageToken) {
            await prismaClient.job.create({
                data: { args: JSON.stringify({ userId, pageToken: nextPageToken }), type: 'messagePageDownload' },
            });
            console.log(
                'CURRENT RESULTS ARE',
                await prismaClient.job.findMany({
                    where: {
                        type: 'messagePageDownload',
                    },
                }),
            );
            gmailListExecutor.addJob({ userId, pageToken: nextPageToken });
        } else {
            mailboxEmitter.syncCompleted();
        }
    });

    gmailListExecutor.addJob({ userId });
};
