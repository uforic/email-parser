import React, { useState } from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import {
    MailboxHome,
    MailboxHomeVariables,
    MailboxHome_getResultsPage_results_data,
} from './__generated__/MailboxHome';
import { LinkType, TrackerType } from './__generated__/globals';
import { MessagePreviewContainer } from './MessagePreview';
import { SyncStatus } from './SyncStatus';

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
            <SyncStatus {...data.getMailboxSyncStatus} />
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
                        {data.getResultsPage.nextToken ? (
                            <button
                                onClick={() => {
                                    setNextPageToken(data.getResultsPage.nextToken);
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

const Results = (props: { data: MailboxHome; onClickMessage: (messageId: string, charPos?: number) => void }) => {
    return (
        <div>
            {props.data.getResultsPage.results.map((result) => {
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

const analysisToSummary = (analysisType: MailboxHome_getResultsPage_results_data) => {
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

const getFirstCharPos = (analysis: MailboxHome_getResultsPage_results_data) => {
    if (analysis.__typename === 'LinkData') {
        return analysis.linkResults
            .map((result) => result.firstCharPos)
            .filter((charPos) => charPos != null && charPos >= 0)[0];
    } else if (analysis.__typename === 'TrackingData') {
        console.log(analysis.trackingResults.map((result) => result.firstCharPos));
        return analysis.trackingResults
            .map((result) => result.firstCharPos)
            .filter((charPos) => charPos != null && charPos >= 0)[0];
    }
    return undefined;
};

const QUERY = gql`
    query MailboxHome($nextPageToken: Int, $analysisType: String) {
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
`;

export default Mailbox;
