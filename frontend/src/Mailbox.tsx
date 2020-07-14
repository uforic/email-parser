import React, { useState } from 'react';
import './App.css';
import { useQuery, gql, useMutation } from '@apollo/client';
import {
    MailboxHome,
    MailboxHomeVariables,
    MailboxHome_mailbox_getResultsPage_results_data,
    MailboxHome_mailbox_getMailboxSyncStatus,
} from './__generated__/MailboxHome';
import { MessagePreview, MessagePreviewVariables } from './__generated__/MessagePreview';
import { LinkType, JobStatus, TrackerType } from './__generated__/globals';
import { SyncMailbox } from './__generated__/SyncMailbox';
import { MailboxStats, MailboxStatsVariables } from './__generated__/MailboxStats';

const Mailbox = () => {
    const [nextPageToken, setNextPageToken] = useState<number | null>(null);
    const [analysisType, setAnalysisType] = useState<'linkAnalysis' | 'trackerAnalysis' | null>(null);
    const { loading, data, error } = useQuery<MailboxHome, MailboxHomeVariables>(QUERY, {
        variables: {
            nextPageToken,
            analysisType,
        },
    });
    const [selectedMessage, setSelectedMessage] = useState<{ id: string; charPos?: number } | null>(null);

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

    const onClickMessage = (messageId: string, charPos?: number) => {
        setSelectedMessage({ id: messageId, charPos });
    };
    return (
        <div>
            <SyncStatus {...data.mailbox.getMailboxSyncStatus} />
            <div style={{ display: 'flex' }}>
                <div>
                    <div>
                        <h2>Analysis Inbox</h2>
                        <h3>Analysis type:</h3>
                        <select
                            value={analysisType === null ? 'undefined' : analysisType}
                            name="Analysis Type"
                            onChange={(event) => {
                                setAnalysisType(
                                    event.target.value === 'undefined' ? null : (event.target.value as 'linkAnalysis'),
                                );
                                setNextPageToken(null);
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
                <MessagePreviewContainer message={selectedMessage} />
            </div>
        </div>
    );
};

const SyncStatus = (props: MailboxHome_mailbox_getMailboxSyncStatus) => {
    const [syncMailbox, { loading }] = useMutation<SyncMailbox>(SYNC_MAILBOX_MUTATION);
    const { data: statsData } = useQuery<MailboxStats, MailboxStatsVariables>(STATS_QUERY, {
        variables: {
            jobId: props.id,
        },
        // pollInterval: 5000,
    });
    const _stats = statsData?.mailbox.getMailboxSyncStats;
    let stats;
    if (_stats != null) {
        stats = {
            messagedQueuedToDownload: _stats.downloadMessage.NOT_STARTED - _stats.downloadMessage.IN_PROGRESS,
            messagesDownloaded: _stats.downloadMessage.COMPLETED,
            messagesDownloadFailed: _stats.downloadMessage.FAILED,
            messagesQueuedToProcess: _stats.analyzeMessage.NOT_STARTED - _stats.analyzeMessage.IN_PROGRESS,
            messagesProcessed: _stats.analyzeMessage.COMPLETED,
            messagesProcessedFailed: _stats.analyzeMessage.FAILED,
        };
    }

    return (
        <div>
            <div>{props.userId}</div>
            <div>{props.status}</div>
            <div>Job started: {new Date(props.createdAt * 1000).toString()}</div>
            <div>Job status updated: {new Date(props.updatedAt * 1000).toString()}</div>
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
                disabled={[JobStatus.IN_PROGRESS, JobStatus.NOT_STARTED].includes(props.status) || loading}
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
                            <span>
                                {trackingTypeToDisplay(data.type)}:{data.domain}
                            </span>
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

const getFirstCharPos = (analysis: MailboxHome_mailbox_getResultsPage_results_data) => {
    if (analysis.__typename === 'LinkData') {
        return analysis.linkResults.find((result) => result.firstCharPos != null && result.firstCharPos >= 0)
            ?.firstCharPos;
    } else if (analysis.__typename === 'TrackingData') {
        return analysis.trackingResults.find((result) => result.firstCharPos != null && result.firstCharPos >= 0)
            ?.firstCharPos;
    }
    return undefined;
};

const Results = (props: { data: MailboxHome; onClickMessage: (messageId: string, charPos?: number) => void }) => {
    return (
        <div>
            {props.data.mailbox.getResultsPage.results.map((result) => {
                return (
                    <div key={result.id} style={{ display: 'flex', maxWidth: '800px' }}>
                        <div>{result.messageId}</div>
                        <div>{analysisTypeToDisplay(result.data.__typename)}</div>
                        <div>{analysisToSummary(result.data)}</div>
                        <button onClick={() => props.onClickMessage(result.messageId, getFirstCharPos(result.data))}>
                            Preview message
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

const MessagePreviewContainer = (props: { message: { id: string; charPos?: number } | null }) => {
    const contents =
        props.message == null ? <div>No message loaded.</div> : <MessagePreviewComponent message={props.message} />;
    return (
        <div style={{ borderLeftWidth: '2px', borderLeftColor: 'black', borderLeftStyle: 'solid', maxWidth: '600px' }}>
            <h2>Message preview</h2>
            {contents}
        </div>
    );
};

const MessagePreviewComponent = (props: { message: { id: string; charPos?: number } }) => {
    const { loading, data } = useQuery<MessagePreview, MessagePreviewVariables>(MESSAGE_PREVIEW_QUERY, {
        variables: {
            messageId: props.message.id,
            charPos: props.message.charPos,
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
            {previewData.matchPreview && <div>Match Preview: {previewData.matchPreview}</div>}
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
                                firstCharPos
                            }
                        }
                        ... on TrackingData {
                            trackingResults: results {
                                type
                                domain
                                href
                                type
                                firstCharPos
                            }
                        }
                    }
                }
            }
        }
    }
`;

const MESSAGE_PREVIEW_QUERY = gql`
    query MessagePreview($messageId: String!, $charPos: Int) {
        mailbox {
            getMessagePreview(messageId: $messageId, charPos: $charPos) {
                subject
                to
                from
                snippet
                id
                matchPreview
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
