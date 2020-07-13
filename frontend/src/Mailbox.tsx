import React, { useState } from 'react';
import './App.css';
import { useQuery, gql, useMutation } from '@apollo/client';
import {
    MailboxHome,
    MailboxHomeVariables,
    MailboxHome_mailbox_getResultsPage_results_data,
} from './__generated__/MailboxHome';
import { MessagePreview, MessagePreviewVariables } from './__generated__/MessagePreview';
import { LinkType, JobStatus, TrackerType } from './__generated__/globals';
import { SyncMailbox } from './__generated__/SyncMailbox';
import { MailboxStats, MailboxStatsVariables } from './__generated__/MailboxStats';

function Mailbox() {
    const [nextPageToken, setNextPageToken] = useState<number | null>(null);
    const [analysisType, setAnalysisType] = useState<'linkAnalysis' | 'trackerAnalysis' | null>(null);
    const { loading, data, error } = useQuery<MailboxHome, MailboxHomeVariables>(QUERY, {
        pollInterval: 5000,
        variables: {
            nextPageToken,
            analysisType,
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
                        <select
                            value={analysisType === null ? 'undefined' : analysisType}
                            name="Analysis Type"
                            onChange={(event) => {
                                setAnalysisType(
                                    event.target.value === 'undefined' ? null : (event.target.value as 'linkAnalysis'),
                                );
                                setSelectedMessage(null);
                            }}
                        >
                            <option value="undefined">Undefined</option>
                            <option value="linkAnalysis">Link analysis</option>
                            <option value="trackerAnalysis">Tracker analysis</option>
                        </select>

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
    const [syncMailbox, { loading }] = useMutation<SyncMailbox>(SYNC_MAILBOX_MUTATION);
    const { data: statsData } = useQuery<MailboxStats, MailboxStatsVariables>(STATS_QUERY, {
        variables: {
            jobId: props.data.mailbox.getMailboxSyncStatus.id,
        },
        pollInterval: 1000,
    });
    const _stats = statsData?.mailbox.getMailboxSyncStats;
    let stats;
    if (_stats != null) {
        stats = {
            messagedQueuedToDownload:
                _stats.downloadMessage.IN_PROGRESS - (_stats.downloadMessage.COMPLETED + _stats.downloadMessage.FAILED),
            messagesDownloaded: _stats.downloadMessage.COMPLETED,
            messagesDownloadFailed: _stats.downloadMessage.FAILED,
            messagesQueuedToProcess:
                _stats.analyzeMessage.IN_PROGRESS - (_stats.analyzeMessage.COMPLETED + _stats.analyzeMessage.FAILED),
            messagesProcessed: _stats.analyzeMessage.COMPLETED,
            messagesProcessedFailed: _stats.analyzeMessage.FAILED,
        };
    }

    return (
        <div>
            <div>{props.data.mailbox.getMailboxSyncStatus.userId}</div>
            <div>{props.data.mailbox.getMailboxSyncStatus.status}</div>
            <div>Job started: {new Date(props.data.mailbox.getMailboxSyncStatus.createdAt * 1000).toString()}</div>
            <div>
                Job status updated: {new Date(props.data.mailbox.getMailboxSyncStatus.updatedAt * 1000).toString()}
            </div>
            {stats && (
                <div>
                    Stats:
                    <ul>
                        <li>Messages queued to download: {stats.messagedQueuedToDownload}</li>
                        <li>Messages downloaded: {stats.messagesDownloaded}</li>
                        <li>Messages download failed: {stats.messagesDownloadFailed}</li>
                        <li>Messages queued to process: {stats.messagesQueuedToProcess}</li>
                        <li>Messages processed: {stats.messagesProcessed}</li>
                        <li>Messages failed to process: {stats.messagesProcessedFailed}</li>
                    </ul>
                </div>
            )}
            <button
                disabled={
                    [JobStatus.IN_PROGRESS, JobStatus.NOT_STARTED].includes(
                        props.data.mailbox.getMailboxSyncStatus.status,
                    ) || loading
                }
                onClick={() => syncMailbox()}
            >
                Sync mailbox
            </button>
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

const trackingTypeToDisplay = (trackerType: TrackerType) => {
    if (trackerType === TrackerType.ONEBYONE) {
        return '1x1 pixel';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    trackerType as never;
};

const analysisToSummary = (analysisType: MailboxHome_mailbox_getResultsPage_results_data) => {
    if (analysisType.__typename === 'LinkData') {
        return (
            <ul>
                {analysisType.linkResults.map((data, idx) => {
                    return (
                        <li key={idx}>
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
    } else if (analysisType.__typename === 'TrackingData') {
        return (
            <ul>
                {analysisType.trackingResults.map((data, idx) => {
                    return (
                        <li key={idx}>
                            <span>{trackingTypeToDisplay(data.type)}</span>
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
                    <div key={result.id} style={{ display: 'flex', maxWidth: '800px' }}>
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

const STATS_QUERY = gql`
    query MailboxStats($jobId: ID!) {
        mailbox {
            getMailboxSyncStats(jobId: $jobId) {
                downloadMessage {
                    NOT_STARTED
                    IN_PROGRESS
                    COMPLETED
                    FAILED
                }
                analyzeMessage {
                    NOT_STARTED
                    IN_PROGRESS
                    COMPLETED
                    FAILED
                }
            }
        }
    }
`;

const QUERY = gql`
    query MailboxHome($nextPageToken: Int, $analysisType: String) {
        mailbox {
            getMailboxSyncStatus {
                id
                userId
                updatedAt
                createdAt
                status
                stats {
                    downloadMessage {
                        NOT_STARTED
                        IN_PROGRESS
                        COMPLETED
                        FAILED
                    }
                    analyzeMessage {
                        NOT_STARTED
                        IN_PROGRESS
                        COMPLETED
                        FAILED
                    }
                }
            }
            getResultsPage(token: $nextPageToken, analysisType: $analysisType) {
                nextToken
                results {
                    id
                    messageId
                    data {
                        ... on LinkData {
                            linkResults: results {
                                type
                                href
                                type
                            }
                        }
                        ... on TrackingData {
                            trackingResults: results {
                                type
                                domain
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

const SYNC_MAILBOX_MUTATION = gql`
    mutation SyncMailbox {
        mailbox {
            syncMailbox
        }
    }
`;

export default Mailbox;
