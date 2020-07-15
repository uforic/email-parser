import { LinkType, TrackerType } from './graphql/__generated__/resolvers';
import { Session } from '@prisma/client';

/**
 * LinkAnalysisData and TrackerAnalysisData are serialized and stored in the database.
 */
export type LinkAnalysisData = Array<DetectedLink>;
export type TrackerAnalysisData = Array<DetectedTracker>;

/**
 * DetectedLink represents the type of the link (aka Google Drive, Google Docs),
 * the href of the link, and the first character position the link appears in the message.
 */
export type DetectedLink = {
    type: LinkType;
    href: string;
    firstCharPos: number;
};

/**
 * DetectedTracker represents a found tracking link in an email. A type is
 * the algorithm that triggered (aka ONEBYONE is a 1x1 pixel), and the domain
 * is just the domain of the href where the <img tag points.
 */
export type DetectedTracker = {
    type: TrackerType;
    href: string;
    firstCharPos: number;
    domain: string;
};

interface GoogleCredentials {
    userId: string;
    accessToken: string;
    refreshToken: string;
}

export type ApolloContext = {
    env: EnvVars;
    gmailCredentials?: GoogleCredentials;
    sid?: string;
};

export interface ServerContext {
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
    gmailCredentials: GoogleCredentials;
}

export interface EmailSession extends Express.SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
}

export interface ParsedSessionRecord extends Session {
    parsedSession: EmailSession;
}
