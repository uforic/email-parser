import { LinkType, TrackerType } from './graphql/resolvers';
import { Session } from '@prisma/client';

export type LinkAnalysisData = Array<DetectedLink>;
export type TrackerAnalysisData = Array<DetectedTracker>;

export type DetectedLink = {
    type: LinkType;
    href: string;
    firstCharPos: number;
};

export type DetectedTracker = {
    type: TrackerType;
    href: string;
    firstCharPos: number;
    domain: string;
};

export const DOWNLOAD_MESSAGE = 'downloadMessage';
export const SYNC_MAILBOX = 'syncMailbox';
export const ANALYZE_MESSAGE = 'analyzeMessage';

export type JobType = typeof DOWNLOAD_MESSAGE | typeof SYNC_MAILBOX | typeof ANALYZE_MESSAGE;

export type Auth = {
    userId: string;
    accessToken: string;
    refreshToken: string;
};

export type ApolloContext = {
    env: EnvVars;
    gmailCredentials?: Auth;
    sid?: string;
};

export interface Context {
    env: EnvVars;
}

export type EnvVars = {
    gmailClientSecret: string;
    gmailClientId: string;
    gmailRedirectUrl: string;
    cacheDirectory: string;
    authSuccessRedirectUrl: string;
    serverPort: number;
    frontendAssetPath?: string;
    logLevel: 'info' | 'trace';
};

export interface GmailContext {
    gmailCredentials: {
        userId: string;
        accessToken: string;
        refreshToken: string;
    };
}

export interface EmailSession extends Express.SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
}

export interface ParsedSessionRecord extends Session {
    parsedSession: EmailSession;
}
