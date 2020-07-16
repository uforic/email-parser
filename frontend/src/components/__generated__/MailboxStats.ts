/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobStatus } from "./../../__generated__/globals";

// ====================================================
// GraphQL query operation: MailboxStats
// ====================================================

export interface MailboxStats_getMailboxSyncStatus_stats_DOWNLOAD_MESSAGE {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStatus_stats_ANALYZE_MESSAGE {
  __typename: "JobStats";
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  FAILED: number;
  timeSpent: number;
}

export interface MailboxStats_getMailboxSyncStatus_stats {
  __typename: "JobCounters";
  DOWNLOAD_MESSAGE: MailboxStats_getMailboxSyncStatus_stats_DOWNLOAD_MESSAGE;
  ANALYZE_MESSAGE: MailboxStats_getMailboxSyncStatus_stats_ANALYZE_MESSAGE;
}

export interface MailboxStats_getMailboxSyncStatus {
  __typename: "MailboxSyncStatus";
  id: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
  status: JobStatus;
  stats: MailboxStats_getMailboxSyncStatus_stats | null;
}

export interface MailboxStats {
  getMailboxSyncStatus: MailboxStats_getMailboxSyncStatus;
}
