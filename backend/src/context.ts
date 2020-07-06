import { getEnvVars, EnvVars } from './env';

export interface Context {
    env: EnvVars;
}

export interface GmailContext extends Context {
    gmailCredentials: {
        userId: string;
        accessToken: string;
    };
}

export const createContext = () => {
    return {
        env: getEnvVars(),
    } as Context;
};

const tokens: Record<string, string> = {};

export const setAccessTokenForUser = (userId: string, accessToken: string) => {
    tokens[userId] = accessToken;
};

const getAccessTokenForUser = (userId: string) => {
    return tokens[userId];
};

export const createGmailContext = (userId: string): GmailContext => {
    return {
        env: getEnvVars(),
        gmailCredentials: {
            userId: userId,
            accessToken: getAccessTokenForUser(userId),
        },
    } as GmailContext;
};
