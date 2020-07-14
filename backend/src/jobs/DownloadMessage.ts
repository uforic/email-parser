import { createGmailContext } from '../context';
import { getMessage } from '../clients/gmail';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JobExecutor } from '../jobs/JobExecutor';
import { DOWNLOAD_MESSAGE } from '../types';
import { PROCESS_MESSAGE_EXECUTOR } from './ProcessMessage';

type DownloadMessageArgs = {
    messageId: string;
};

export const DOWNLOAD_MESSAGE_EXECUTOR = new JobExecutor<DownloadMessageArgs>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = createGmailContext(job.userId);
        const messagePath = join(context.env.cacheDirectory, messageId + '.json');
        if (existsSync(messagePath)) {
            await PROCESS_MESSAGE_EXECUTOR.addJobs(job.userId, job.parentId, [{ messageId }]);
            return;
        }
        const message = await getMessage(context, job.userId, messageId);
        writeFileSync(messagePath, JSON.stringify(message));
        await PROCESS_MESSAGE_EXECUTOR.addJobs(job.userId, job.parentId, [{ messageId }]);
    },
    DOWNLOAD_MESSAGE,
    {
        maxConcurrentJobs: 10,
    },
);
