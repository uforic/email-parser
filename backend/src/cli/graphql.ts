import { ApolloServer, gql } from 'apollo-server-express';
import express, { Request } from 'express';
import { getOauth2Url, getToken, listMessages } from '../clients/gmail';
import { createContext } from '../context';
import session from 'express-session';

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

    type MailboxQueries {
        getMailboxSyncStatus: MailboxSyncStatus!
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        auth: Auth!
        mailbox: MailboxQueries!
    }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        mailbox: () => ({
            getMailboxSyncStatus: () => {
                return {
                    numMessagesSeen: 50,
                    numMessagesDownloaded: 500,
                    isCompleted: true,
                };
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

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (obj: { req: Request }) => {
        const { req } = obj;
        console.log('HERE IS CALLED', req?.session, req?.session?.accessToken);
        return {
            accessToken: req?.session?.accessToken,
        };
    },
});

const app = express();
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`));

app.get('/oauth2callback', async (req, res, next) => {
    const code = req.query.code as string;
    const tokens = await getToken(serverContext, code);
    console.log('CODE IS FOO', code);
    console.log('TOKEN IS BAR', JSON.stringify(tokens));
    const session = req.session;
    if (session) {
        session.accessToken = tokens.access_token;
        session.save(() => {});
        console.log('SETTING SESSION ID TO ', req?.session?.id);
    }

    res.redirect('http://localhost:8080/mailbox');
    next();
});

app.get('/auth/gmail', (_, res) => {
    const url = getOauth2Url(serverContext);
    res.redirect(url);
});
