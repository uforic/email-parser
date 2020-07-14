/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MessagePreview
// ====================================================

export interface MessagePreview_mailbox_getMessagePreview {
  __typename: "MessagePreview";
  subject: string;
  to: string;
  from: string;
  snippet: string;
  id: string;
  matchPreview: string | null;
}

export interface MessagePreview_mailbox {
  __typename: "MailboxQueries";
  getMessagePreview: MessagePreview_mailbox_getMessagePreview | null;
}

export interface MessagePreview {
  mailbox: MessagePreview_mailbox;
}

export interface MessagePreviewVariables {
  messageId: string;
  charPos?: number | null;
}
