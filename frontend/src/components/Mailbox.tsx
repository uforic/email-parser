import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { MailboxHome, MailboxHomeVariables } from '../__generated__/MailboxHome';
import { MessagePreviewContainer } from './MessagePreview';
import { SyncStatus } from './SyncStatus';
import { useLocation, useHistory } from 'react-router-dom';
import { Results } from './Results';

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
