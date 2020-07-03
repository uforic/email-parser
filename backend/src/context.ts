import { getEnvVars, EnvVars } from './env';

export interface Context {
    env: EnvVars;
}

export interface GmailContext extends Context {
    gmailCredentials: {};
}

export const createContext = () => {
    return {
        env: getEnvVars(),
    } as Context;
};
