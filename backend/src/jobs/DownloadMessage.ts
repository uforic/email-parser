import { createGmailAndServerContext } from '../context';
import { getMessage } from '../clients/gmail';

import { JobExecutor } from '../jobs/JobExecutor';
import { DOWNLOAD_MESSAGE } from '../types';
import { PROCESS_MESSAGE_EXECUTOR } from './ProcessMessage';
import { existsMessage, storeMessage } from '../stores/messageStore';

type DownloadMessageArgs = {
    messageId: string;
};

// downloads a message if it doesn't exist on disk already, and stores it to disk.
// the adds the next job (process message)
export const DOWNLOAD_MESSAGE_EXECUTOR = new JobExecutor<DownloadMessageArgs>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = await createGmailAndServerContext(job.userId);
        const messageAlreadyDownloaded = await existsMessage(context, messageId);
        if (!messageAlreadyDownloaded) {
            const message = await getMessage(context, job.userId, messageId);
            await storeMessage(context, messageId, message);
        }
        await PROCESS_MESSAGE_EXECUTOR.addJobs(job.userId, job.parentId, [{ messageId }]);
    },
    DOWNLOAD_MESSAGE,
    {
        maxConcurrentJobs: 200,
    },
);
