import { mailboxEmitter } from './EventEmitter';
import { analyzeEmail, DetectedLink } from '../cmd/parse_message';
import { createContext } from '../context';
import { loadMessage, ANALYZE_MESSAGE, storeResult } from '../store';
import { JobExecutor } from '../jobs/JobExecutor';

const LINK_ANALYSIS = 'linkAnalysis';
export type LinkAnalysisData = Array<DetectedLink>;

const PARSE_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (userId, args) => {
        const { messageId } = args;
        const context = createContext();
        const message = loadMessage(context, messageId);
        const results = analyzeEmail(context, message);
        if (results.linkResults.length > 0) {
            storeResult(userId, messageId, LINK_ANALYSIS, results.linkResults);
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
