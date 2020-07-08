/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobStatus, LinkType } from "./globals";

// ====================================================
// GraphQL query operation: MailboxHome
// ====================================================

export interface MailboxHome_mailbox_getMailboxSyncStatus {
  __typename: "MailboxSyncStatus";
  userId: string;
  numMessagesSeen: number;
  numMessagesDownloaded: number;
  updatedAt: number;
  createdAt: number;
  status: JobStatus;
  isCompleted: boolean;
}

export interface MailboxHome_mailbox_getResultsPage_results_data_TrackingData {
  __typename: "TrackingData";
}

export interface MailboxHome_mailbox_getResultsPage_results_data_LinkData_results {
  __typename: "LinkDetection";
  type: LinkType;
  href: string;
}

export interface MailboxHome_mailbox_getResultsPage_results_data_LinkData {
  __typename: "LinkData";
  results: MailboxHome_mailbox_getResultsPage_results_data_LinkData_results[];
}

export type MailboxHome_mailbox_getResultsPage_results_data = MailboxHome_mailbox_getResultsPage_results_data_TrackingData | MailboxHome_mailbox_getResultsPage_results_data_LinkData;

export interface MailboxHome_mailbox_getResultsPage_results {
  __typename: "Result";
  messageId: string;
  data: MailboxHome_mailbox_getResultsPage_results_data;
}

export interface MailboxHome_mailbox_getResultsPage {
  __typename: "ResultsPage";
  nextToken: number | null;
  results: MailboxHome_mailbox_getResultsPage_results[];
}

export interface MailboxHome_mailbox {
  __typename: "MailboxQueries";
  getMailboxSyncStatus: MailboxHome_mailbox_getMailboxSyncStatus;
  getResultsPage: MailboxHome_mailbox_getResultsPage;
}

export interface MailboxHome {
  mailbox: MailboxHome_mailbox;
}

export interface MailboxHomeVariables {
  nextPageToken?: number | null;
}
