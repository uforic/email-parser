import { JobExecutor } from '../jobs/JobExecutor';
import { analyzeEmail } from '../cmd/parse_message';
import { createContext } from '../context';
import { storeResult, storeMessageMeta } from '../stores/store';
import { loadMessage, loadMetadata } from '../stores/messageStore';
import { ANALYZE_MESSAGE } from '../types';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../constants';

// analyzes a message, and then stores the analysis results to the database
export const PROCESS_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = createContext();
        const message = loadMessage(context, messageId);
        const messageMeta = loadMetadata(message);
        storeMessageMeta(messageId, messageMeta.subject, messageMeta.from, messageMeta.to);
        const results = await analyzeEmail(context, message);
        if (results.linkResults.length > 0) {
            storeResult(job.userId, messageId, LINK_ANALYSIS, results.linkResults);
        }
        if (results.trackerResults.length > 0) {
            storeResult(job.userId, messageId, TRACKER_ANALYSIS, results.trackerResults);
        }
    },
    ANALYZE_MESSAGE,
    {
        maxConcurrentJobs: 50,
    },
);
