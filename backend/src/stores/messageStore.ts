import { Context } from '../context';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gmail_v1 } from 'googleapis';
import { writeFileSync, existsSync } from 'fs';

const messagePath = (context: Context, messageId: string) => {
    return join(context.env.cacheDirectory, messageId + '.json');
};

export const storeMessage = async (context: Context, messageId: string, message: gmail_v1.Schema$Message) => {
    const messagePth = messagePath(context, messageId);
    writeFileSync(messagePth, JSON.stringify(message));
};

export const existsMessage = async (context: Context, messageId: string) => {
    const messagePth = messagePath(context, messageId);
    if (existsSync(messagePth)) {
        return true;
    }
    return false;
};

export const loadMessage = (context: Context, messageId: string): gmail_v1.Schema$Message & { id: string } => {
    return {
        ...JSON.parse(readFileSync(messagePath(context, messageId)).toString()),
        id: messageId,
    };
};

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
