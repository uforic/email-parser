import { ApolloServer } from 'apollo-server-express';
import express, { Request } from 'express';
import { getOauth2Url, getToken } from './clients/gmail';
import { createContext, setAccessTokenForUser, createGmailContext } from './context';
import session from 'express-session';
import { resetAllJobs } from './stores/store';
import { syncMailbox } from './cmd/sync_mailbox';
import { resolvers, ApolloContext } from './graphql/graphql';
import { join } from 'path';
import { readFileSync } from 'fs';

const apolloServer = new ApolloServer({
    typeDefs: readFileSync(join(__dirname, '..', 'schema.graphql'), 'utf8').toString(),
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
    formatError: (error) => {
        console.error('GraphQL Error: ', error);
        return error;
    },
});

const app = express();
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000000 } }));

apolloServer.applyMiddleware({ app });

app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`));

app.get('/oauth2callback', async (req, res, next) => {
    const code = req.query.code as string;
    const serverContext = createContext();
    const { access_token, userId } = await getToken(serverContext, code);
    // TODO: Figure out how to get this from the google response
    const session = req.session;
    if (session) {
        session.userId = userId;
        session.accessToken = access_token;
        session.save(() => {});
        setAccessTokenForUser(userId, access_token as string);
        const context = createGmailContext(userId);
        syncMailbox(context, context.env.cacheDirectory, {});
    }
    res.redirect('http://localhost:8080/mailbox');
    next();
});

app.get('/auth/gmail', (_, res) => {
    const serverContext = createContext();
    const url = getOauth2Url(serverContext);
    res.redirect(url);
});

resetAllJobs();
