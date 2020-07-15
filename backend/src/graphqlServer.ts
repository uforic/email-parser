import { ApolloServer } from 'apollo-server-express';
import express, { Request } from 'express';
import { getOauth2Url, getToken } from './clients/gmail';
import { createContext } from './context';
import session, { MemoryStore } from 'express-session';
import { resetAllJobs, getInitialJobCounts } from './stores/store';
import { syncMailbox } from './cmd/sync_mailbox';
import { resolvers } from './graphql/graphql';
import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import startJobQueues from './jobs/startJobQueues';
import SessionStore from './stores/SessionStore';
import { envVars, validateEnv } from './env';
import { ApolloContext } from './types';
import { initCounters } from './stores/counter';

// make sure all required env vars are present
console.log('Starting server with environment variables:\n', envVars);
validateEnv(envVars);

const apolloServer = new ApolloServer({
    typeDefs: readFileSync(join(__dirname, '..', 'schema.graphql'), 'utf8').toString(),
    resolvers: {
        ...resolvers,
        AnalysisData: {
            __resolveType: (parent: any) => {
                return parent.__typename;
            },
        },
    },
    context: (obj: { req: Request }): ApolloContext => {
        const { req } = obj;
        if (req?.session?.accessToken && req?.session?.userId) {
            return {
                env: envVars,
                gmailCredentials: {
                    accessToken: req?.session?.accessToken,
                    userId: req?.session?.userId,
                    refreshToken: req?.session?.refreshToken,
                },
            };
        }
        return { env: envVars, gmailCredentials: undefined };
    },
    formatError: (error) => {
        console.error('GraphQL Error: ', error);
        return error;
    },
});

const app = express();

app.use(
    session({
        store: new SessionStore() as MemoryStore,
        secret: 'keyboard cat',
        cookie: { maxAge: 60000000 },
        saveUninitialized: true,
        resave: false,
    }),
);

apolloServer.applyMiddleware({ app });

app.listen({ port: envVars.serverPort }, () =>
    console.log(`🚀 Server ready at http://localhost:${envVars.serverPort}${apolloServer.graphqlPath}`),
);

app.get('/oauth2callback', async (req, res, next) => {
    const code = req.query.code as string;
    const serverContext = createContext();
    const { access_token, userId, refresh_token } = await getToken(serverContext, code);
    const session = req.session;
    if (session) {
        session.userId = userId;
        session.accessToken = access_token;
        session.refreshToken = refresh_token;
        session.save(() => {});
        const context = {
            ...serverContext,
            gmailCredentials: {
                userId,
                accessToken: access_token || '',
                refreshToken: refresh_token || '',
            },
        };
        // we kick off a sync when the user logs in for the first time
        syncMailbox(context, context.env.cacheDirectory, {});
    }
    res.redirect(serverContext.env.authSuccessRedirectUrl);
    next();
});

app.get('/auth/gmail', (_, res) => {
    const serverContext = createContext();
    const url = getOauth2Url(serverContext);
    res.redirect(url);
});

// to develop quickly, you can not specify a frontend asset path,
// and use the create react app dev server to be the frontend.
// once you're ready to run this in production, you provide a frontendAssetPath
// and the nodejs server serves this up
if (envVars.frontendAssetPath != null) {
    console.log('Serving single page app from: ', envVars.frontendAssetPath);
    app.use('/static', express.static(join(resolve(envVars.frontendAssetPath as string), 'static')));
    app.get('/*', function (req, res, next) {
        res.sendFile(join(resolve(envVars.frontendAssetPath as string), 'index.html'));
    });
}

const initializeServer = async () => {
    // this resets all in progress jobs to not_started, so that they will retry
    resetAllJobs();
    // now, we set the counters up so that we can track in flight jobs
    const initialJobCount = await getInitialJobCounts();
    initCounters(initialJobCount);
    // the job queues don't poll, so we need to start them when we init
    startJobQueues();
};

initializeServer();
