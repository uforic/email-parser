import { homedir } from 'os';
import { join } from 'path';
import { EnvVars } from '../types';

const initEnvVars = () => {
    // gmail related stuff
    const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
    const gmailClientId = process.env.GMAIL_CLIENT_ID;
    const gmailRedirectUrl = process.env.GMAIL_REDIRECT_URL;
    // where do we store the email messages on disk (not stored in DB)
    const cacheDirectory = process.env.CACHE_DIRECTORY || join(homedir(), 'message_cache');
    // once the user successfully oauths, and reaches the callback, where do we redirect to
    const authSuccessRedirectUrl = process.env.AUTH_SUCCESS_REDIRECT_URL || '/mailbox';
    // In development mode, this is 4000. It needs to match the port on GMAIL_REDIRECT_URL
    const serverPort = process.env.SERVER_PORT ? Number.parseInt(process.env.SERVER_PORT) : 4000;
    // when this is set, the server will serve assets from this path, and not depend on a running webpack devserver
    // without this set, you can run webpack dev server in the frontend folder, and using setupProxy
    // redirect backend queries only (no asset serving queries) to this backed
    const frontendAssetPath = process.env.FRONTEND_ASSET_PATH;
    const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();

    return {
        gmailClientSecret,
        gmailClientId,
        gmailRedirectUrl,
        cacheDirectory,
        authSuccessRedirectUrl,
        serverPort,
        frontendAssetPath,
        logLevel,
    } as EnvVars;
};
export const envVars: EnvVars = initEnvVars();

export const validateEnv = (envVars: EnvVars) => {
    const {
        gmailClientSecret,
        gmailClientId,
        gmailRedirectUrl,
        cacheDirectory,
        authSuccessRedirectUrl,
        serverPort,
        logLevel,
    } = envVars;
    if (
        [
            gmailClientSecret,
            gmailClientId,
            gmailRedirectUrl,
            cacheDirectory,
            authSuccessRedirectUrl,
            serverPort,
            logLevel,
        ].filter((elem) => !Boolean(elem)).length > 0
    ) {
        throw new Error(
            "Can't start server without defining all of [GMAIL_CLIENT_SECRET, GMAIL_CLIENT_ID,GMAIL_REDIRECT_URL, AUTH_SUCCESS_REDIRECT_URL, optional: CACHE_DIRECTORY]",
        );
    }
};
