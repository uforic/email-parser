import { JobExecutor } from '../jobs/JobExecutor';
import { DetectedLink, analyzeEmail, DetectedTracker } from '../cmd/parse_message';
import { createContext } from '../context';
import { loadMessage, storeResult, ANALYZE_MESSAGE } from '../stores/store';

export const LINK_ANALYSIS = 'linkAnalysis';
export const TRACKER_ANALYSIS = 'trackerAnalysis';
export type LinkAnalysisData = Array<DetectedLink>;
export type TrackerAnalysisData = Array<DetectedTracker>;

export const PROCESS_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = createContext();
        const message = loadMessage(context, messageId);
        const results = analyzeEmail(context, message);
        if (results.linkResults.length > 0) {
            storeResult(job.userId, messageId, LINK_ANALYSIS, results.linkResults);
        }
        if (results.trackerResults.length > 0) {
            storeResult(job.userId, messageId, TRACKER_ANALYSIS, results.trackerResults);
        }
    },
    ANALYZE_MESSAGE,
    {
        maxConcurrentJobs: 10,
    },
);
