import { ForbiddenError } from 'apollo-server-express';
import { loadMessage, loadMetadata, getPageOfResults, getMostRecentMailboxSyncJob } from '../stores/store';
import { createGmailContext, createContext } from '../context';
import { syncMailbox } from '../cmd/sync_mailbox';
import { getCounter } from '../stores/counter';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../constants';
import { QueryResolvers, JobStatus, MailboxMutationsResolvers } from './resolvers';
import { isDefined } from '../utils';
import { getMessagePreview } from '../cmd/get_html_preview';
import { TrackerAnalysisData, LinkAnalysisData } from '../types';

export function assertLoggedIn(auth: any): asserts auth {
    if (auth == null) {
        throw new ForbiddenError('User must be logged in to access this endpoint.');
    }
}

const Queries: QueryResolvers<ApolloContext> = {
    getMailboxSyncStatus: async (_parent, _args, context) => {
        assertLoggedIn(context.auth);
        const recentSync = await getMostRecentMailboxSyncJob(context.auth.userId);
        const jobCounter = getCounter(recentSync.id);
        const status = {
            id: recentSync.id.toString(),
            userId: context.auth.userId,
            createdAt: recentSync.createdAt,
            updatedAt: recentSync.updatedAt,
            status: recentSync.status as JobStatus,
            stats: jobCounter,
        };
        return status;
    },
    getResultsPage: async (_parent, args, context) => {
        assertLoggedIn(context.auth);
        const { results, nextPageToken } = await getPageOfResults(
            context.auth.userId,
            PAGE_SIZE,
            args.token != null ? args.token : undefined,
            args.analysisType != null ? args.analysisType : undefined,
        );

        const transformedResults = results
            .map((result) => {
                const { type } = result;
                switch (type) {
                    case LINK_ANALYSIS:
                        return {
                            messageId: result.messageId,
                            id: result.id.toString(),
                            data: { __typename: 'LinkData' as 'LinkData', results: result.data as LinkAnalysisData },
                        };
                    case TRACKER_ANALYSIS:
                        return {
                            messageId: result.messageId,
                            id: result.id.toString(),
                            data: {
                                __typename: 'TrackingData' as 'TrackingData',
                                results: result.data as TrackerAnalysisData,
                            },
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
        assertLoggedIn(context.auth);
        const jobCounters = getCounter(Number.parseInt(args.jobId));
        return jobCounters || null;
    },
    getMessagePreview: async (_parent, args, context) => {
        assertLoggedIn(context.auth);
        const serverContext = createContext();
        const message = await loadMessage(serverContext, args.messageId);
        let matchPreview;
        if (args.charPos != null && args.charPos >= 0) {
            matchPreview = getMessagePreview(serverContext, message, args.charPos).matchPreview[0];
        }

        const metadata = { ...loadMetadata(message), matchPreview };
        return metadata;
    },
};

const Mutations: MailboxMutationsResolvers = {
    syncMailbox: async (_parent, _args, context) => {
        assertLoggedIn(context.auth);
        const gmailContext = createGmailContext(context.auth.userId);
        await syncMailbox(gmailContext, gmailContext.env.cacheDirectory, { maxPages: 0 });
        return true;
    },
};

const PAGE_SIZE = 10;

export const resolvers = {
    Mutation: {
        mailbox: () => {
            return Object.fromEntries(
                Object.keys(Mutations).map((key) => {
                    const resolver = Mutations[key];
                    return [key, async (args: any, context: any) => await resolver({}, args, context)];
                }),
            );
        },
    },
    Query: Queries,
};

type Auth = {
    userId: string;
    accessToken: string;
};

export type ApolloContext = {
    auth?: Auth;
};
