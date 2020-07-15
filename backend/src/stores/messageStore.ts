import { Context } from '../types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gmail_v1 } from 'googleapis';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

/**
 * messageStore handles reading and writing Gmail messages to the message cache.
 * The program uses disk to cache messages, so that subsequent syncs are faster
 * and don't use up the API.
 */

// puts messages in /message_cache/{last two digits of id}/messageId.json
const messagePath = (context: Context, messageId: string) => {
    return {
        dir: join(context.env.cacheDirectory, messageId.slice(-2)),
        path: join(context.env.cacheDirectory, messageId.slice(-2), messageId + '.json'),
    };
};

export const storeMessage = async (context: Context, messageId: string, message: gmail_v1.Schema$Message) => {
    const pathAndDir = messagePath(context, messageId);
    if (!existsSync(pathAndDir.dir)) {
        mkdirSync(pathAndDir.dir);
    }
    writeFileSync(pathAndDir.path, JSON.stringify(message));
};

export const existsMessage = async (context: Context, messageId: string) => {
    const pathAndDir = messagePath(context, messageId);
    if (existsSync(pathAndDir.path)) {
        return true;
    }
    return false;
};

export const loadMessage = (context: Context, messageId: string): gmail_v1.Schema$Message & { id: string } => {
    const pathAndDir = messagePath(context, messageId);
    return {
        ...JSON.parse(readFileSync(pathAndDir.path).toString()),
        id: messageId,
    };
};

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
