// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against

import { ForbiddenError } from 'apollo-server-express';
import { loadMessage, loadMetadata, getPageOfResults, getMostRecentMailboxSyncJob } from '../stores/store';
import { createGmailContext, createContext } from '../context';
import { syncMailbox } from '../cmd/sync_mailbox';
import { getCounter } from '../stores/counter';
import { LINK_ANALYSIS, TRACKER_ANALYSIS } from '../jobs/ProcessMessage';

export function assertLoggedIn(auth: any): asserts auth {
    if (auth == null) {
        throw new ForbiddenError('User must be logged in to access this endpoint.');
    }
}

const PAGE_SIZE = 10;
// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
export const resolvers = {
    Mutation: {
        mailbox: () => ({
            syncMailbox: async (_: any, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const gmailContext = createGmailContext(context.auth.userId);
                await syncMailbox(gmailContext, gmailContext.env.cacheDirectory, { maxPages: 0 });
                return true;
            },
        }),
    },
    Query: {
        mailbox: () => ({
            getMailboxSyncStatus: async (_: any, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const recentSync = await getMostRecentMailboxSyncJob(context.auth.userId);
                const jobCounter = getCounter(recentSync.id);
                const status = {
                    id: recentSync.id,
                    userId: context.auth.userId,
                    createdAt: recentSync.createdAt,
                    updatedAt: recentSync.updatedAt,
                    status: recentSync.status,
                    stats: jobCounter,
                };
                return status;
            },
            getResultsPage: async (args: { token?: number; analysisType?: string }, context: ApolloContext) => {
                assertLoggedIn(context.auth);

                const { results, nextPageToken } = await getPageOfResults(
                    context.auth.userId,
                    PAGE_SIZE,
                    args.token,
                    args.analysisType,
                );

                const transformedResults = results.map((result) => {
                    const { type } = result;
                    switch (type) {
                        case LINK_ANALYSIS:
                            return {
                                messageId: result.messageId,
                                id: result.id,
                                data: { __typename: 'LinkData', results: result.data },
                            };
                        case TRACKER_ANALYSIS:
                            return {
                                messageId: result.messageId,
                                id: result.id,
                                data: { __typename: 'TrackingData', results: result.data },
                            };
                        default:
                            const typeCheck: never = type;
                            // @ts-ignore
                            typeCheck;
                    }
                });
                const returnObj = {
                    results: transformedResults,
                    nextToken: nextPageToken || null,
                };
                return returnObj;
            },
            getMessagePreview: async (args: { messageId: string }, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const serverContext = createContext();
                const message = await loadMessage(serverContext, args.messageId);
                return loadMetadata(message);
            },
        }),
    },
};

type Auth = {
    userId: string;
    accessToken: string;
};

export type ApolloContext = {
    auth?: Auth;
};
