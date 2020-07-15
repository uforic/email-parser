import { MessagePreview, MessagePreviewVariables } from './__generated__/MessagePreview';
import React from 'react';
import { useQuery, gql } from '@apollo/client';

export const MessagePreviewContainer = (props: {
    message: { id: string; charPos?: number };
    onCloseMessage: () => void;
}) => {
    return (
        <div style={{ borderLeftWidth: '2px', borderLeftColor: 'black', borderLeftStyle: 'solid', maxWidth: '600px' }}>
            <button onClick={props.onCloseMessage}>Close preview</button>
            <h2>Message preview</h2>
            <MessagePreviewComponent message={props.message} />
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
    if (loading || !data || !data.getMessagePreview) {
        return <div>Loading data...</div>;
    }
    const previewData = data.getMessagePreview;
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
                <h3>From:</h3>
                <div>{previewData.from}</div>
            </div>
            <div>
                <h3>To:</h3>
                <div>{previewData.to}</div>
            </div>
            <div>
                <h3>Subject:</h3>
                <div>{previewData.subject}</div>
            </div>
            <div>
                <h3>Message Preview:</h3>
                <div>{previewData.snippet}</div>
            </div>
            {previewData.matchPreview && (
                <div>
                    <h3>Match Preview:</h3>
                    <div>{previewData.matchPreview}</div>
                </div>
            )}
        </div>
    );
};

const MESSAGE_PREVIEW_QUERY = gql`
    query MessagePreview($messageId: String!, $charPos: Int) {
        getMessagePreview(messageId: $messageId, charPos: $charPos) {
            subject
            to
            from
            snippet
            id
            matchPreview
        }
    }
`;
