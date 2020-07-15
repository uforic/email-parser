import { clearPendingJobsForUser } from '../stores/store';
import { syncMailbox } from '../cmd/sync_mailbox';
import { clearCounter } from '../stores/counter';
import { MailboxMutationsResolvers } from './__generated__/resolvers';
import { ApolloContext, GmailContext } from '../types';
import { assertLoggedIn } from './helpers';

export const Mutations: MailboxMutationsResolvers = {
    syncMailbox: async (_parent, _args, context: ApolloContext) => {
        assertLoggedIn(context.gmailCredentials);
        await syncMailbox(context as GmailContext, context.env.cacheDirectory, { maxPages: 0 });
        return true;
    },
    clearJobs: async (_parent, args, context: ApolloContext) => {
        assertLoggedIn(context.gmailCredentials);
        clearPendingJobsForUser(context.gmailCredentials.userId, Number.parseInt(args.parentJobId));
        clearCounter(Number.parseInt(args.parentJobId));
        return true;
    },
};
