import { getPageOfResults, getMostRecentMailboxSyncJob } from '../stores/store';
import { loadMessage } from '../stores/messageStore';
import { getCounter } from '../stores/counter';
import { QueryResolvers, JobStatus, AnalysisType } from './__generated__/resolvers';
import { isDefined } from '../helpers/utils';
import { getMessagePreview } from '../cmd/get_html_preview';
import { TrackerAnalysisData, LinkAnalysisData, ApolloContext } from '../types';
import { assertLoggedIn } from './helpers';
import { loadMetadata } from '../helpers/loadMetadata';

// we use the autogenerated code from resolvers, and can ensure we have type
// safe return types.
export const Queries: QueryResolvers<ApolloContext> = {
    getMailboxSyncStatus: async (_parent, _args, context) => {
        assertLoggedIn(context.gmailCredentials);
        const recentSync = await getMostRecentMailboxSyncJob(context.gmailCredentials.userId);
        const jobCounter = getCounter(recentSync.id);
        const status = {
            id: recentSync.id.toString(),
            userId: context.gmailCredentials.userId,
            createdAt: recentSync.createdAt,
            updatedAt: recentSync.updatedAt,
            status: recentSync.status as JobStatus,
            stats: jobCounter,
        };
        return status;
    },
    getResultsPage: async (_parent, args, context) => {
        assertLoggedIn(context.gmailCredentials);
        const { results, nextPageToken } = await getPageOfResults(
            context.gmailCredentials.userId,
            PAGE_SIZE,
            args.token != null ? args.token : undefined,
            args.analysisType != null ? args.analysisType : undefined,
        );

        const transformedResults = results
            .map((result) => {
                let meta = undefined;
                if (result.message) {
                    meta = {
                        from: result.message.from,
                        to: result.message.to,
                        subject: result.message.subject,
                        id: result.message.messageId,
                    };
                }
                const { type } = result;
                switch (type) {
                    case AnalysisType.LinkAnalysis:
                        return {
                            messageId: result.messageId,
                            id: result.id.toString(),
                            data: { __typename: 'LinkData' as 'LinkData', results: result.data as LinkAnalysisData },
                            meta,
                        };
                    case AnalysisType.TrackerAnalysis:
                        return {
                            messageId: result.messageId,
                            id: result.id.toString(),
                            data: {
                                __typename: 'TrackingData' as 'TrackingData',
                                results: result.data as TrackerAnalysisData,
                            },
                            meta,
                        };
                    default:
                        const typeCheck: never = type;
                        // @ts-ignore
                        typeCheck;
                }
            })
            .filter(isDefined);
        const returnObj = {
            results: transformedResults,
            nextToken: nextPageToken || null,
        };
        return returnObj;
    },
    getMailboxSyncStats: async (_parent, args: { jobId: string }, context) => {
        assertLoggedIn(context.gmailCredentials);
        const jobCounters = getCounter(Number.parseInt(args.jobId));
        return jobCounters || null;
    },
    getMessagePreview: async (_parent, args, context) => {
        assertLoggedIn(context.gmailCredentials);
        const message = await loadMessage(context, args.messageId);
        let matchPreview;
        if (args.charPos != null && args.charPos >= 0) {
            matchPreview = getMessagePreview(context, message, args.charPos).matchPreview[0];
        }

        const metadata = { ...loadMetadata(message), matchPreview };
        return metadata;
    },
};

export const PAGE_SIZE = 10;
