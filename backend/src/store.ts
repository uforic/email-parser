import { mailboxEmitter } from './events/EventEmitter';
import { DetectedLink } from './cmd/parse_message';
import { Context } from './context';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gmail_v1 } from 'googleapis';

export const state = {
    numberOfMessagesSeen: 0,
    numberOfMessagesDownloaded: 0,
    syncCompleted: false,
    results: [] as Array<{ messageId: string; results: Array<DetectedLink> }>,
};

mailboxEmitter.onMessagePageDownloaded((numMessages) => {
    state.numberOfMessagesSeen += numMessages;
});
mailboxEmitter.onMessageDownloaded(() => {
    state.numberOfMessagesDownloaded++;
});
mailboxEmitter.onSyncCompleted(() => {
    state.syncCompleted = true;
});

export const loadMessage = (context: Context, messageId: string): gmail_v1.Schema$Message => {
    return JSON.parse(readFileSync(join(context.env.cacheDirectory, messageId + '.json')).toString());
};

export const loadMetadata = (
    message: gmail_v1.Schema$Message,
): { subject: string; from: string; to: string; snippet: string } => {
    const headers = message.payload?.headers;
    const metadata = {
        subject: '',
        from: '',
        to: '',
        snippet: '',
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
