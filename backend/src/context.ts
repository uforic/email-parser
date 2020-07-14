import { getEnvVars, EnvVars } from './env';
import { getSavedSessionByUser } from './stores/store';

export interface Context {
    env: EnvVars;
}

export interface GmailContext extends Context {
    gmailCredentials: {
        userId: string;
        accessToken: string;
        refreshToken: string;
    };
}

export const createContext = () => {
    return {
        env: getEnvVars(),
    } as Context;
};

const tokens: Record<string, string> = {};

export const createGmailContext = async (userId: string): Promise<GmailContext> => {
    const session = await getSavedSessionByUser(userId);
    if (!session) {
        throw new Error(`No user session stored for ${userId}`);
    }
    const { accessToken, refreshToken } = JSON.parse(session.session);
    return {
        env: getEnvVars(),
        gmailCredentials: {
            userId: userId,
            accessToken,
            refreshToken,
        },
    } as GmailContext;
};
