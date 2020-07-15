import { envVars } from './env';
import { getSavedSessionByUser } from './stores/sessions';
import { ServerContext, GmailContext } from './types';

export const createServerContext = () => {
    return {
        env: envVars,
    } as ServerContext;
};

export const createGmailAndServerContext = async (userId: string): Promise<GmailContext & ServerContext> => {
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
    } as GmailContext & ServerContext;
};
