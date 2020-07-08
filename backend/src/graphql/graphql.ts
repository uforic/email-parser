// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against

import { gql, ForbiddenError } from 'apollo-server-express';
import { state, loadMessage, loadMetadata, getPageOfResults, getMostRecentMailboxSyncJob } from '../store';
import { createGmailContext, createContext } from '../context';
import { syncMailbox } from '../cmd/sync_mailbox';

export function assertLoggedIn(auth: any): asserts auth {
    if (auth == null) {
        throw new ForbiddenError('User must be logged in to access this endpoint.');
    }
}

const PAGE_SIZE = 10;
// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
export const resolvers = {
    Query: {
        mailbox: () => ({
            getMailboxSyncStatus: async (_: any, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const recentSync = await getMostRecentMailboxSyncJob(context.auth.userId);
                const status = {
                    userId: context.auth.userId,
                    createdAt: recentSync.createdAt,
                    updatedAt: recentSync.updatedAt,
                    status: recentSync.status,
                    numMessagesSeen: state.numberOfMessagesSeen || 0,
                    numMessagesDownloaded: state.numberOfMessagesDownloaded || 0,
                    isCompleted: state.syncCompleted || false,
                };
                return status;
            },
            getResultsPage: async (args: { token?: number }, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const { results, nextPageToken } = await getPageOfResults(context.auth.userId, PAGE_SIZE, args.token);
                const transformedResults = results.map((result) => {
                    return {
                        messageId: result.messageId,
                        data: { __typename: 'LinkData', results: result.data },
                    };
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
            syncMailbox: async (_: any, context: ApolloContext) => {
                assertLoggedIn(context.auth);
                const gmailContext = createGmailContext(context.auth.userId);
                syncMailbox(gmailContext, context.auth.userId, gmailContext.env.cacheDirectory, { maxPages: 0 });
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
