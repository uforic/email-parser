import { homedir } from 'os';
import { join } from 'path';

export type EnvVars = {
    gmailClientSecret: string;
    gmailClientId: string;
    gmailRedirectUrl: string;
    cacheDirectory: string;
    authSuccessRedirectUrl: string;
    serverPort: number;
    frontendAssetPath?: string;
};

export const getEnvVars = () => {
    const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
    const gmailClientId = process.env.GMAIL_CLIENT_ID;
    const gmailRedirectUrl = process.env.GMAIL_REDIRECT_URL;
    const cacheDirectory = process.env.CACHE_DIRECTORY || join(homedir(), 'message_cache');
    const authSuccessRedirectUrl = process.env.AUTH_SUCCESS_REDIRECT_URL || '/mailbox';
    const serverPort = process.env.SERVER_PORT ? Number.parseInt(process.env.SERVER_PORT) : 4000;
    const frontendAssetPath = process.env.FRONTEND_ASSET_PATH;

    return {
        gmailClientSecret,
        gmailClientId,
        gmailRedirectUrl,
        cacheDirectory,
        authSuccessRedirectUrl,
        serverPort,
        frontendAssetPath,
    } as EnvVars;
};

export const validateEnv = (envVars: EnvVars) => {
    const {
        gmailClientSecret,
        gmailClientId,
        gmailRedirectUrl,
        cacheDirectory,
        authSuccessRedirectUrl,
        serverPort,
    } = envVars;
    if (
        [gmailClientSecret, gmailClientId, gmailRedirectUrl, cacheDirectory, authSuccessRedirectUrl, serverPort].filter(
            (elem) => !Boolean(elem),
        ).length > 0
    ) {
        throw new Error(
            "Can't start server without defining all of [GMAIL_CLIENT_SECRET, GMAIL_CLIENT_ID,GMAIL_REDIRECT_URL, AUTH_SUCCESS_REDIRECT_URL, optional: CACHE_DIRECTORY]",
        );
    }
};
