/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MailboxStats
// ====================================================

export interface MailboxStats_getMailboxSyncStats_DOWNLOAD_MESSAGE {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStats_ANALYZE_MESSAGE {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStats {
  __typename: "JobCounters";
  DOWNLOAD_MESSAGE: MailboxStats_getMailboxSyncStats_DOWNLOAD_MESSAGE;
  ANALYZE_MESSAGE: MailboxStats_getMailboxSyncStats_ANALYZE_MESSAGE;
}

export interface MailboxStats {
  getMailboxSyncStats: MailboxStats_getMailboxSyncStats | null;
}

export interface MailboxStatsVariables {
  jobId: string;
}
