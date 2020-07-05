import React, { useState } from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import { MailboxHome, MailboxHomeVariables } from './__generated__/MailboxHome';
import { MessagePreview, MessagePreviewVariables } from './__generated__/MessagePreview';

function Mailbox() {
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const { loading, data } = useQuery<MailboxHome, MailboxHomeVariables>(QUERY, {
        pollInterval: 1000,
        variables: {
            nextPageToken,
        },
    });
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

    if (loading || !data) {
        return <div>Loading...</div>;
    }

    const onClickMessage = (messageId: string) => {
        setSelectedMessage(messageId);
    };
    return (
        <div>
            <SyncStatus data={data} />
            <Results data={data} onClickMessage={onClickMessage} />
            <div>
                <button onClick={() => setNextPageToken(null)}>First page</button>
                {data.mailbox.getResultsPage.nextToken ? (
                    <button onClick={() => setNextPageToken(data.mailbox.getResultsPage.nextToken)}>Next page</button>
                ) : null}
            </div>
            {selectedMessage != null ? <MessagePreviewComponent messageId={selectedMessage} /> : null}
        </div>
    );
}

const SyncStatus = (props: { data: MailboxHome }) => {
    if (props.data.mailbox.getMailboxSyncStatus.isCompleted) {
        return <div>Sync complete!</div>;
    }
    return <div>Loading {JSON.stringify(props.data.mailbox.getMailboxSyncStatus)}</div>;
};

const Results = (props: { data: MailboxHome; onClickMessage: (messageId: string) => void }) => {
    return (
        <React.Fragment>
            {' '}
            {props.data.mailbox.getResultsPage.results.map((result) => {
                return (
                    <div id={result.messageId} onClick={() => props.onClickMessage(result.messageId)}>
                        {result.messageId + '_' + JSON.stringify(result.results)}
                    </div>
                );
            })}
        </React.Fragment>
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
    query MailboxHome($nextPageToken: String) {
        mailbox {
            getMailboxSyncStatus {
                numMessagesSeen
                numMessagesDownloaded
                isCompleted
            }
            getResultsPage(token: $nextPageToken) {
                nextToken
                results {
                    messageId
                    results {
                        type
                        href
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
