import { GmailContext, createGmailContext } from '../context';
import { listMessages, getMessage } from '../clients/gmail';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assertDefined, isDefined } from '../utils';
import { JobExecutor } from '../jobs/JobExecutor';
import { mailboxEmitter } from '../events/EventEmitter';
import { DOWNLOAD_MESSAGE, SYNC_MAILBOX } from '../store';

const DOWNLOAD_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (userId, args) => {
        // console.log(userId, args);
        const { messageId } = args;
        const context = createGmailContext(userId);
        const messagePath = join(context.env.cacheDirectory, messageId + '.json');
        if (existsSync(messagePath)) {
            mailboxEmitter.messageDownloaded(userId, messageId);
            return;
        }
        const message = await getMessage(context, userId, messageId);
        writeFileSync(messagePath, JSON.stringify(message));
        mailboxEmitter.messageDownloaded(userId, messageId);
    },
    DOWNLOAD_MESSAGE,
    {
        maxConcurrentJobs: 1,
    },
);

const SYNC_MAILBOX_EXECUTOR = new JobExecutor<{ maxPages: number }>(async (userId, args) => {
    console.log('PROCESSING JOB', args, userId);
    let pageCount = 0;
    const context = createGmailContext(userId);
    const processNextPage = async (nextToken: string | undefined) => {
        console.log('PROCESSING PAGE', pageCount);
        const { messages, nextPageToken } = await listMessages(context, context.gmailCredentials.userId, nextToken);
        assertDefined(messages);
        pageCount += 1;
        const jobs = messages
            .map(({ id }) => id)
            .filter(isDefined)
            .map((id) => {
                return { messageId: id };
            });
        DOWNLOAD_MESSAGE_EXECUTOR.addJobs(userId, jobs);
        if (args.maxPages && pageCount >= args.maxPages) {
            return;
        }
        mailboxEmitter.messagePageDownloaded(messages.length);
        if (nextPageToken) {
            processNextPage(nextPageToken);
        }
    };
    processNextPage(undefined);
}, SYNC_MAILBOX);

export const syncMailbox = async (
    context: GmailContext,
    userId: string,
    cacheDirectory: string,
    options: {
        // for debugging, to limit network requests / wait
        maxPages?: number;
    },
) => {
    if (!existsSync(cacheDirectory)) {
        mkdirSync(cacheDirectory);
    }
    SYNC_MAILBOX_EXECUTOR.addJobs(userId, [{ maxPages: options.maxPages || 0 }]);
};
