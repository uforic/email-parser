/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MailboxStats
// ====================================================

export interface MailboxStats_mailbox_getMailboxSyncStats_downloadMessage {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
}

export interface MailboxStats_mailbox_getMailboxSyncStats_analyzeMessage {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
}

export interface MailboxStats_mailbox_getMailboxSyncStats {
  __typename: "JobCounters";
  downloadMessage: MailboxStats_mailbox_getMailboxSyncStats_downloadMessage;
  analyzeMessage: MailboxStats_mailbox_getMailboxSyncStats_analyzeMessage;
}

export interface MailboxStats_mailbox {
  __typename: "MailboxQueries";
  getMailboxSyncStats: MailboxStats_mailbox_getMailboxSyncStats | null;
}

export interface MailboxStats {
  mailbox: MailboxStats_mailbox;
}

export interface MailboxStatsVariables {
  jobId: string;
}
