import { ServerContext } from '../types';
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
const messagePath = (context: ServerContext, messageId: string) => {
    return {
        dir: join(context.env.cacheDirectory, messageId.slice(-2)),
        path: join(context.env.cacheDirectory, messageId.slice(-2), messageId + '.json'),
    };
};

export const storeMessage = (context: ServerContext, messageId: string, message: gmail_v1.Schema$Message) => {
    const pathAndDir = messagePath(context, messageId);
    if (!existsSync(pathAndDir.dir)) {
        mkdirSync(pathAndDir.dir);
    }
    writeFileSync(pathAndDir.path, JSON.stringify(message));
};

export const existsMessage = async (context: ServerContext, messageId: string) => {
    const pathAndDir = messagePath(context, messageId);
    if (existsSync(pathAndDir.path)) {
        return true;
    }
    return false;
};

export const loadMessage = (context: ServerContext, messageId: string): gmail_v1.Schema$Message & { id: string } => {
    const pathAndDir = messagePath(context, messageId);
    return {
        ...JSON.parse(readFileSync(pathAndDir.path).toString()),
        id: messageId,
    };
};
