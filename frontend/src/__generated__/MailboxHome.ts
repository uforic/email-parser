/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MailboxHome
// ====================================================

export interface MailboxHome_mailbox_getMailboxSyncStatus {
  __typename: "MailboxSyncStatus";
  numMessagesSeen: number;
  numMessagesDownloaded: number;
  isCompleted: boolean;
}

export interface MailboxHome_mailbox_getResultsPage_results_results {
  __typename: "LinkDetection";
  type: string;
  href: string;
}

export interface MailboxHome_mailbox_getResultsPage_results {
  __typename: "Result";
  messageId: string;
  results: MailboxHome_mailbox_getResultsPage_results_results[];
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
