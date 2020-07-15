import { createGmailContext } from '../context';
import { getMessage } from '../clients/gmail';

import { JobExecutor } from '../jobs/JobExecutor';
import { DOWNLOAD_MESSAGE } from '../types';
import { PROCESS_MESSAGE_EXECUTOR } from './ProcessMessage';
import { existsMessage, storeMessage } from '../stores/messageStore';

type DownloadMessageArgs = {
    messageId: string;
};

export const DOWNLOAD_MESSAGE_EXECUTOR = new JobExecutor<DownloadMessageArgs>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = await createGmailContext(job.userId);
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
