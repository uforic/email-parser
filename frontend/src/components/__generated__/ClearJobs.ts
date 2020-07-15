/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ClearJobs
// ====================================================

export interface ClearJobs_mailbox {
  __typename: "MailboxMutations";
  clearJobs: boolean;
}

export interface ClearJobs {
  mailbox: ClearJobs_mailbox;
}

export interface ClearJobsVariables {
  parentJobId: string;
}
