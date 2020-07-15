import { createGmailAndServerContext } from '../context';
import { listMessages } from '../clients/gmail';
import { assertDefined, isDefined } from '../helpers/utils';
import { JobExecutor } from '../jobs/JobExecutor';
import { JobType } from '../graphql/__generated__/resolvers';
import { DOWNLOAD_MESSAGE_EXECUTOR } from './DownloadMessage';

// iterates through all the pages of a user's gmail, and adds a downloadMessage job for each message
// that it finds.
export const SYNC_MAILBOX_EXECUTOR = new JobExecutor<{ maxPages: number }>(
    async (job) => {
        let pageCount = 0;
        const context = await createGmailAndServerContext(job.userId);
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
            if (nextPageToken) {
                await processNextPage(nextPageToken);
            }
        };
        await processNextPage(undefined);
    },
    JobType.SyncMailbox,
    { maxConcurrentJobs: 1 },
);
