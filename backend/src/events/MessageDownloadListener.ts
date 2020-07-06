import { mailboxEmitter } from './EventEmitter';
import { parseEmail } from '../cmd/parse_message';
import { createContext, createGmailContext } from '../context';
import { state, loadMessage, ANALYZE_MESSAGE, storeResult } from '../store';
import { JobExecutor } from '../jobs/JobExecutor';

const PARSE_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (userId, args) => {
        const { messageId } = args;
        const context = createContext();
        const message = loadMessage(context, messageId);
        const results = parseEmail(context, message);
        if (results.length > 0) {
            results.forEach((result) => {
                storeResult(userId, messageId, 'googleDocs', result);
            });
        }
    },
    ANALYZE_MESSAGE,
    {
        maxConcurrentJobs: 1,
    },
);

mailboxEmitter.onMessageDownloaded(async (userId, messageId) => {
    PARSE_MESSAGE_EXECUTOR.addJob(userId, {
        messageId,
    });
});
