import { JobExecutor } from '../jobs/JobExecutor';
import { analyzeEmail } from '../cmd/parse_message';
import { createServerContext } from '../context';
import { storeResult, storeMessageMeta } from '../stores/store';
import { loadMessage } from '../stores/messageStore';

import { AnalysisType, JobType } from '../graphql/__generated__/resolvers';
import { loadMetadata } from '../helpers/loadMetadata';

// analyzes a message, and then stores the analysis results to the database
export const PROCESS_MESSAGE_EXECUTOR = new JobExecutor<{ messageId: string }>(
    async (job) => {
        const { messageId } = job.jobArgs;
        const context = createServerContext();
        const message = loadMessage(context, messageId);
        const messageMeta = loadMetadata(message);
        storeMessageMeta(messageId, messageMeta.subject, messageMeta.from, messageMeta.to);
        const results = await analyzeEmail(context, message);
        if (results.linkResults.length > 0) {
            storeResult(job.userId, messageId, AnalysisType.LinkAnalysis, results.linkResults);
        }
        if (results.trackerResults.length > 0) {
            storeResult(job.userId, messageId, AnalysisType.TrackerAnalysis, results.trackerResults);
        }
    },
    JobType.AnalyzeMessage,
    {
        maxConcurrentJobs: 50,
    },
);
