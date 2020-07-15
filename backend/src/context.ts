import { envVars } from './env';
import { getSavedSessionByUser } from './stores/sessions';
import { Context, GmailContext } from './types';

export const createContext = () => {
    return {
        env: envVars,
    } as Context;
};

export const createGmailAndServerContext = async (userId: string): Promise<GmailContext & Context> => {
    const session = await getSavedSessionByUser(userId);
    if (!session) {
        throw new Error(`No user session stored for ${userId}`);
    }
    const { accessToken, refreshToken } = session.parsedSession;
    return {
        env: envVars,
        gmailCredentials: {
            userId: userId,
            accessToken,
            refreshToken,
        },
    } as GmailContext & Context;
};
