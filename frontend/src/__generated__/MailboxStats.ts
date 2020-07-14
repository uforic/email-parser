/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MailboxStats
// ====================================================

export interface MailboxStats_getMailboxSyncStats_downloadMessage {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStats_analyzeMessage {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStats {
  __typename: "JobCounters";
  downloadMessage: MailboxStats_getMailboxSyncStats_downloadMessage;
  analyzeMessage: MailboxStats_getMailboxSyncStats_analyzeMessage;
}

export interface MailboxStats {
  getMailboxSyncStats: MailboxStats_getMailboxSyncStats | null;
}

export interface MailboxStatsVariables {
  jobId: string;
}
