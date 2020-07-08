import React, { useState } from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import {
    MailboxHome,
    MailboxHomeVariables,
    MailboxHome_mailbox_getResultsPage_results_data,
} from './__generated__/MailboxHome';
import { MessagePreview, MessagePreviewVariables } from './__generated__/MessagePreview';
import { LinkType } from './__generated__/globals';

function Mailbox() {
    const [nextPageToken, setNextPageToken] = useState<number | null>(null);
    const { loading, data, error } = useQuery<MailboxHome, MailboxHomeVariables>(QUERY, {
        pollInterval: 1000,
        variables: {
            nextPageToken,
        },
    });
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

    if (error?.graphQLErrors?.[0]?.extensions?.code === 'FORBIDDEN') {
        return (
            <div>
                You are not logged in. Please relogin on the home page.
                <button onClick={() => (window.location.href = '/')}>Take me home</button>
            </div>
        );
    } else if (error != null) {
        return (
            <div>
                Unknown error occurred. Are you connected to the backend?
                <button onClick={() => (window.location.href = '/')}>Take me home</button>
            </div>
        );
    }

    if (loading || !data) {
        return <div>Loading...</div>;
    }

    const onClickMessage = (messageId: string) => {
        setSelectedMessage(messageId);
    };
    return (
        <div>
            <SyncStatus data={data} />
            <div style={{ display: 'flex' }}>
                <div>
                    <div>
                        <h2>Analysis Inbox</h2>
                        <Results data={data} onClickMessage={onClickMessage} />
                    </div>
                    <div>
                        <button onClick={() => setNextPageToken(null)}>First page</button>
                        {data.mailbox.getResultsPage.nextToken ? (
                            <button
                                onClick={() => {
                                    setNextPageToken(data.mailbox.getResultsPage.nextToken);
                                    setSelectedMessage(null);
                                }}
                            >
                                Next page
                            </button>
                        ) : null}
                    </div>
                </div>
                <MessagePreviewContainer messageId={selectedMessage} />
            </div>
        </div>
    );
}

const SyncStatus = (props: { data: MailboxHome }) => {
    if (props.data.mailbox.getMailboxSyncStatus.isCompleted) {
        return <div>Sync complete!</div>;
    }
    return (
        <div>
            <div>{props.data.mailbox.getMailboxSyncStatus.userId}</div>
            <div>{props.data.mailbox.getMailboxSyncStatus.status}</div>
            <div>Job started: {new Date(props.data.mailbox.getMailboxSyncStatus.createdAt).toString()}</div>
            <div>Job status updated: {new Date(props.data.mailbox.getMailboxSyncStatus.updatedAt).toString()}</div>
        </div>
    );
};

const analysisTypeToDisplay = (analysisType: 'TrackingData' | 'LinkData') => {
    if (analysisType === 'LinkData') {
        return 'Unsecured link';
    } else if (analysisType === 'TrackingData') {
        return 'Tracking pixel detection';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    analysisType as never;
};

const linkTypeToDisplay = (linkType: LinkType) => {
    if (linkType === LinkType.GOOGLE_DOCS) {
        return 'Google Docs';
    } else if (linkType === LinkType.GOOGLE_DRIVE) {
        return 'Google Drive';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    linkType as never;
};

const analysisToSummary = (analysisType: MailboxHome_mailbox_getResultsPage_results_data) => {
    if (analysisType.__typename === 'LinkData') {
        return (
            <ul>
                {analysisType.results.map((data) => {
                    return (
                        <li>
                            <span>{linkTypeToDisplay(data.type)}</span>
                            <span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.href);
                                    }}
                                >
                                    Copy URL
                                </button>
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }
    return 'UNKNOWN';
};

const Results = (props: { data: MailboxHome; onClickMessage: (messageId: string) => void }) => {
    return (
        <div>
            {props.data.mailbox.getResultsPage.results.map((result) => {
                return (
                    <div id={result.messageId.concat(result.__typename)} style={{ display: 'flex', maxWidth: '800px' }}>
                        <div>{result.messageId}</div>
                        <div>{analysisTypeToDisplay(result.data.__typename)}</div>
                        <div>{analysisToSummary(result.data)}</div>
                        <button onClick={() => props.onClickMessage(result.messageId)}>Preview message</button>
                    </div>
                );
            })}
        </div>
    );
};

const MessagePreviewContainer = (props: { messageId: string | null }) => {
    const contents =
        props.messageId == null ? (
            <div>No message loaded.</div>
        ) : (
            <MessagePreviewComponent messageId={props.messageId} />
        );
    return (
        <div style={{ borderLeftWidth: '2px', borderLeftColor: 'black', borderLeftStyle: 'solid', maxWidth: '600px' }}>
            <h2>Message preview</h2>
            {contents}
        </div>
    );
};

const MessagePreviewComponent = (props: { messageId: string }) => {
    const { loading, data } = useQuery<MessagePreview, MessagePreviewVariables>(MESSAGE_PREVIEW_QUERY, {
        variables: {
            messageId: props.messageId,
        },
    });
    if (loading || !data || !data.mailbox.getMessagePreview) {
        return <div>Loading data...</div>;
    }
    const previewData = data.mailbox.getMessagePreview;
    return (
        <div>
            <div>From: {previewData.from}</div>
            <div>To: {previewData.to}</div>
            <div>Subject: {previewData.subject}</div>
            <div>Message Preview: {previewData.snippet}</div>
        </div>
    );
};

const QUERY = gql`
    query MailboxHome($nextPageToken: Int) {
        mailbox {
            getMailboxSyncStatus {
                userId
                numMessagesSeen
                numMessagesDownloaded
                updatedAt
                createdAt
                status
                isCompleted
            }
            getResultsPage(token: $nextPageToken) {
                nextToken
                results {
                    messageId
                    data {
                        ... on LinkData {
                            results {
                                type
                                href
                                type
                            }
                        }
                    }
                }
            }
        }
    }
`;

const MESSAGE_PREVIEW_QUERY = gql`
    query MessagePreview($messageId: String!) {
        mailbox {
            getMessagePreview(messageId: $messageId) {
                subject
                to
                from
                snippet
            }
        }
    }
`;

export default Mailbox;
