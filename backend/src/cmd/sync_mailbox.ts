import { GmailContext } from '../context';
import { listMessages, getMessage } from '../clients/gmail';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assertDefined } from '../utils';
import { JobExecutor } from '../jobs/JobExecutor';

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
                return;
            }
            const message = await getMessage(context, userId, id);
            writeFileSync(messagePath, JSON.stringify(message));
        },
        { maxConcurrentJobs: 100 },
    );
    const gmailListExecutor = new JobExecutor<{ userId: string; pageToken?: string }>(async (args) => {
        const { messages, nextPageToken } = await listMessages(context, args.userId, args.pageToken);
        assertDefined(messages);
        pageCount += 1;
        messages.forEach(({ id }) => {
            assertDefined(id);
            gmailGetExecutor.addJob({ id });
        });
        if (options.maxPages && pageCount >= options.maxPages) {
            return;
        }
        if (nextPageToken) {
            gmailListExecutor.addJob({ userId, pageToken: nextPageToken });
        }
    });

    gmailListExecutor.addJob({ userId });
};
