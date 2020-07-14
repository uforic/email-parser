import { LinkType, TrackerType } from './graphql/resolvers';

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
