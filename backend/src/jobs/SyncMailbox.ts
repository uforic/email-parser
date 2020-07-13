import { createGmailContext } from '../context';
import { listMessages } from '../clients/gmail';
import { assertDefined, isDefined } from '../utils';
import { JobExecutor } from '../jobs/JobExecutor';
import { SYNC_MAILBOX } from '../stores/store';
import { DOWNLOAD_MESSAGE_EXECUTOR } from './DownloadMessage';

export const SYNC_MAILBOX_EXECUTOR = new JobExecutor<{ maxPages: number }>(
    async (job) => {
        let pageCount = 0;
        const context = createGmailContext(job.userId);
        const processNextPage = async (nextToken: string | undefined) => {
            const { maxPages } = job.jobArgs;
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
            await DOWNLOAD_MESSAGE_EXECUTOR.addJobs(job.userId, job.jobId, jobs);
            if (maxPages && pageCount >= maxPages) {
                return;
            }
            // addCount(userId, 'messageProcessed', messages.length);
            if (nextPageToken) {
                processNextPage(nextPageToken);
            }
        };
        processNextPage(undefined);
    },
    SYNC_MAILBOX,
    { maxConcurrentJobs: 1 },
);
