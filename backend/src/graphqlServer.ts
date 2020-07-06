import { ApolloServer, gql } from 'apollo-server-express';
import express, { Request } from 'express';
import { getOauth2Url, getToken } from './clients/gmail';
import { createContext, setAccessTokenForUser, createGmailContext } from './context';
import session from 'express-session';
import { state, loadMessage, loadMetadata, resetAllJobs, getPageOfResults } from './store';
import { syncMailbox } from './cmd/sync_mailbox';
import './events/MessageDownloadListener';
import { assertDefined } from './utils';

const serverContext = createContext();

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    type Auth {
        gmailOauth2Redirect: String!
    }

    type MailboxSyncStatus {
        numMessagesSeen: Int!
        numMessagesDownloaded: Int!
        isCompleted: Boolean!
    }

    type LinkDetection {
        type: String!
        href: String!
        firstCharPos: Int!
    }

    # union DetectionResult = LinkDetection

    type Result {
        messageId: String!
        results: [LinkDetection!]!
    }

    type ResultsPage {
        results: [Result!]!
        nextToken: String
    }

    type MessagePreview {
        subject: String!
        from: String!
        to: String!
        snippet: String!
    }

    type MailboxQueries {
        getMailboxSyncStatus: MailboxSyncStatus!
        getResultsPage(token: String): ResultsPage!
        getMessagePreview(messageId: String!): MessagePreview
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        auth: Auth!
        mailbox: MailboxQueries!
    }
`;

const PAGE_SIZE = 5;
// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        mailbox: () => ({
            getMailboxSyncStatus: () => {
                return {
                    numMessagesSeen: state.numberOfMessagesSeen,
                    numMessagesDownloaded: state.numberOfMessagesDownloaded,
                    isCompleted: state.syncCompleted,
                };
            },
            getResultsPage: async (args: { token?: string }, b: ApolloContext) => {
                assertDefined(b.auth);
                let results = state.results.slice(0, PAGE_SIZE);
                let pageEnd = PAGE_SIZE;
                if (args.token) {
                    const index = state.results.findIndex((result) => result.messageId === args.token);
                    pageEnd = index + PAGE_SIZE;
                    results = state.results.slice(index, pageEnd);
                }

                const otherResults = await getPageOfResults(b.auth.userId);
                const test = otherResults.map((otherResult) => {
                    return {
                        messageId: otherResult.messageId,
                        results: [
                            {
                                type: otherResult.type,
                                href: otherResult.data.href,
                                firstCharPos: otherResult.data.firstCharPos,
                            },
                        ],
                    };
                });
                console.log('OTHERS', test);
                return {
                    results: test,
                    nextToken: state.results[pageEnd + 1]?.messageId,
                };
            },
            getMessagePreview: async (args: { messageId: string }) => {
                const message = await loadMessage(serverContext, args.messageId);
                return loadMetadata(message);
            },
        }),
        auth: () => ({
            gmailOauth2Redirect: () => {
                console;
                return getOauth2Url(serverContext);
            },
        }),
    },
};

type ApolloContext = {
    auth?: {
        userId: string;
        accessToken: string;
    };
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (obj: { req: Request }): ApolloContext => {
        const { req } = obj;
        if (req?.session?.accessToken && req?.session?.userId) {
            return {
                auth: {
                    accessToken: req?.session?.accessToken,
                    userId: req?.session?.userId,
                },
            };
        }
        return { auth: undefined };
    },
});

const app = express();
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`));

app.get('/oauth2callback', async (req, res, next) => {
    const code = req.query.code as string;
    const tokens = await getToken(serverContext, code);
    // TODO: Figure out how to get this from the google response
    const userId = 'matt.sprague@gmail.com';
    const session = req.session;
    if (session) {
        session.userId = userId;
        session.accessToken = tokens.access_token;
        session.save(() => {});
        setAccessTokenForUser(userId, tokens.access_token as string);
        const context = createGmailContext(userId);
        syncMailbox(context, userId, context.env.cacheDirectory, { maxPages: 10 });
    }
    res.redirect('http://localhost:8080/mailbox');
    next();
});

app.get('/auth/gmail', (_, res) => {
    const url = getOauth2Url(serverContext);
    res.redirect(url);
});

resetAllJobs();
