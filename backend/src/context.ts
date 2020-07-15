import { getEnvVars } from './env';
import { getSavedSessionByUser } from './stores/store';
import { Auth, Context, GmailContext } from './types';

export const createContext = () => {
    return {
        env: getEnvVars(),
    } as Context;
};

export const createGmailContext = async (userId: string): Promise<GmailContext & Context> => {
    const session = await getSavedSessionByUser(userId);
    if (!session) {
        throw new Error(`No user session stored for ${userId}`);
    }
    const { accessToken, refreshToken } = session.parsedSession;
    return {
        env: getEnvVars(),
        gmailCredentials: {
            userId: userId,
            accessToken,
            refreshToken,
        },
    } as GmailContext & Context;
};

export const createGmailContextFromApollo = async (authContext: Auth): Promise<GmailContext> => {
    return {
        env: getEnvVars(),
        gmailCredentials: { ...authContext },
    } as GmailContext;
};
