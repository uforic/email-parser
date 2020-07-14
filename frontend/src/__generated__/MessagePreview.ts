/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MessagePreview
// ====================================================

export interface MessagePreview_getMessagePreview {
  __typename: "MessagePreview";
  subject: string;
  to: string;
  from: string;
  snippet: string;
  id: string;
  matchPreview: string | null;
}

export interface MessagePreview {
  getMessagePreview: MessagePreview_getMessagePreview | null;
}

export interface MessagePreviewVariables {
  messageId: string;
  charPos?: number | null;
}
