/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobStatus, LinkType, TrackerType } from "./../../__generated__/globals";

// ====================================================
// GraphQL query operation: MailboxHome
// ====================================================

export interface MailboxHome_getMailboxSyncStatus {
  __typename: "MailboxSyncStatus";
  id: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
  status: JobStatus;
}

export interface MailboxHome_getResultsPage_results_data_LinkData_linkResults {
  __typename: "LinkDetection";
  type: LinkType;
  href: string;
  firstCharPos: number;
}

export interface MailboxHome_getResultsPage_results_data_LinkData {
  __typename: "LinkData";
  linkResults: MailboxHome_getResultsPage_results_data_LinkData_linkResults[];
}

export interface MailboxHome_getResultsPage_results_data_TrackingData_trackingResults {
  __typename: "TrackerDetection";
  type: TrackerType;
  domain: string;
  href: string;
  firstCharPos: number;
}

export interface MailboxHome_getResultsPage_results_data_TrackingData {
  __typename: "TrackingData";
  trackingResults: MailboxHome_getResultsPage_results_data_TrackingData_trackingResults[];
}

export type MailboxHome_getResultsPage_results_data = MailboxHome_getResultsPage_results_data_LinkData | MailboxHome_getResultsPage_results_data_TrackingData;

export interface MailboxHome_getResultsPage_results {
  __typename: "Result";
  id: string;
  messageId: string;
  data: MailboxHome_getResultsPage_results_data;
}

export interface MailboxHome_getResultsPage {
  __typename: "ResultsPage";
  nextToken: number | null;
  results: MailboxHome_getResultsPage_results[];
}

export interface MailboxHome {
  getMailboxSyncStatus: MailboxHome_getMailboxSyncStatus;
  getResultsPage: MailboxHome_getResultsPage;
}

export interface MailboxHomeVariables {
  nextPageToken?: number | null;
  analysisType?: string | null;
}
