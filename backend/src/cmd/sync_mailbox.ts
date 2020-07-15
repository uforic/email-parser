import { GmailContext } from '../types';
import { existsSync, mkdirSync } from 'fs';
import { SYNC_MAILBOX_EXECUTOR } from '../jobs/SyncMailbox';

export const syncMailbox = async (
    context: GmailContext,
    cacheDirectory: string,
    options: {
        // for debugging, to limit network requests / wait
        maxPages?: number;
    },
) => {
    if (!existsSync(cacheDirectory)) {
        mkdirSync(cacheDirectory);
    }
    SYNC_MAILBOX_EXECUTOR.addJobs(context.gmailCredentials.userId, null, [{ maxPages: options.maxPages || 0 }]);
};
