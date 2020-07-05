import { homedir } from 'os';
import { join } from 'path';

export type EnvVars = {
    gmailClientSecret: string;
    gmailClientId: string;
    gmailRedirectUrl: string;
    cacheDirectory: string;
};

export const getEnvVars = () => {
    const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
    const gmailClientId = process.env.GMAIL_CLIENT_ID;
    const gmailRedirectUrl = process.env.GMAIL_REDIRECT_URL;
    const cacheDirectory = process.env.CACHE_DIRECTORY || join(homedir(), 'message_cache');
    return {
        gmailClientSecret,
        gmailClientId,
        gmailRedirectUrl,
        cacheDirectory,
    } as EnvVars;
};
