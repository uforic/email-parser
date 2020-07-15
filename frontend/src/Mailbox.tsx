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
import { useLocation, useHistory } from 'react-router-dom';

// https://reactrouter.com/web/example/query-parameters
// A custom hook that builds on useLocation to parse
// the query string for you.
function useUrlQuery() {
    return new URLSearchParams(useLocation().search);
}

const Mailbox = () => {
    const history = useHistory();
    const query = useUrlQuery();
    const nextPageTokenStr = query.get('nextPageToken');
    const analysisType = query.get('analysisType') || undefined;
    const nextPageToken = nextPageTokenStr ? Number.parseInt(nextPageTokenStr) : undefined;
    const { loading, data, error } = useQuery<MailboxHome, MailboxHomeVariables>(QUERY, {
        variables: {
            nextPageToken,
            analysisType,
        },
        pollInterval: 10000,
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
            <SyncStatus data={data.getMailboxSyncStatus} />
            <div style={{ display: 'flex' }}>
                <div>
                    <div>
                        <h2>Analysis Inbox</h2>
                        <div style={{ display: 'flex' }}>
                            <span>Analysis type filter:</span>
                            <select
                                value={analysisType == null ? 'undefined' : analysisType}
                                name="Analysis type filter"
                                onChange={(event) => {
                                    const newValue = event.target.value === 'undefined' ? null : event.target.value;
                                    if (newValue) {
                                        query.set('analysisType', newValue);
                                    } else {
                                        query.delete('analysisType');
                                    }

                                    query.delete('nextPageToken');
                                    history.push({
                                        pathname: '/mailbox',
                                        search: query.toString(),
                                    });
                                    setSelectedMessage(null);
                                }}
                            >
                                <option value="undefined">All analysis</option>
                                <option value="linkAnalysis">Link analysis</option>
                                <option value="trackerAnalysis">Tracker analysis</option>
                            </select>
                        </div>

                        <Results data={data} onClickMessage={onClickMessage} />
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                query.delete('nextPageToken');
                                history.push({
                                    pathname: '/mailbox',
                                    search: query.toString(),
                                });
                            }}
                        >
                            First page
                        </button>
                        {data.getResultsPage.nextToken ? (
                            <button
                                onClick={() => {
                                    query.set('nextPageToken', data.getResultsPage.nextToken?.toString() as string);
                                    history.push({
                                        pathname: '/mailbox',
                                        search: query.toString(),
                                    });
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
        <table>
            <thead>
                <tr>
                    <th>Message ID</th>
                    <th>Analysis type</th>
                    <th>Analysis summary</th>
                    <th>Preview</th>
                </tr>
            </thead>
            <tbody>
                {props.data.getResultsPage.results.map((result) => {
                    return (
                        <tr key={result.id}>
                            <td>{result.messageId}</td>
                            <td>{analysisTypeToDisplay(result.data.__typename)}</td>
                            <td>{analysisToSummary(result.data)}</td>
                            <td>
                                <button
                                    onClick={() => props.onClickMessage(result.messageId, getFirstCharPos(result.data))}
                                >
                                    Preview message
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
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
