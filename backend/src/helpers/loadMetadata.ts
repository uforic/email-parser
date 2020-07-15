import { gmail_v1 } from 'googleapis';

// one of the calls the frontend makes is to preview a message
// loadMetadata processes a message into parts of interest for the frontend to consume
export const loadMetadata = (
    message: gmail_v1.Schema$Message & { id: string },
): { id: string; subject: string; from: string; to: string; snippet: string } => {
    const headers = message.payload?.headers;
    const metadata = {
        subject: '',
        from: '',
        to: '',
        snippet: '',
        id: message.id,
    };
    if (headers) {
        headers.forEach((header) => {
            if (header.name?.toLowerCase() === 'subject') {
                metadata.subject = header.value || '';
            }
            if (header.name?.toLowerCase() === 'from') {
                metadata.from = header.value || '';
            }
            if (header.name?.toLowerCase() === 'to') {
                metadata.to = header.value || '';
            }
        });
    }
    metadata.snippet = message.snippet || '';
    return metadata;
};
