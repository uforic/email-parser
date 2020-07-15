import { AssertionError } from 'assert';
import { gmail_v1 } from 'googleapis';
import { ServerContext } from '../types';

export function log(context: ServerContext, logLevel: 'trace' | 'info', message: string, ...args: any[]) {
    if (context.env.logLevel === 'trace') {
        console.log(message, ...args);
    }
    if (context.env.logLevel === 'info' && logLevel === 'info') {
        console.log(message, ...args);
    }
}

export function assertDefined(condition: any): asserts condition {
    if (condition == null) {
        throw new AssertionError();
    }
}

export function isDefined<K>(n: K | null | undefined): n is K {
    return n != null;
}

export function isntFalsey<K>(n: K | false): n is K {
    return Boolean(n);
}

export const asyncFilter = async <K>(arr: Array<K>, filterFn: (item: K) => Promise<boolean>) => {
    const filterResults = await Promise.all(arr.map(async (item) => await filterFn(item)));
    return filterResults.map((result, idx) => result && arr[idx]).filter(isntFalsey);
};

const MULTIPART_MIMES = ['multipart/mixed', 'multipart/related', 'multipart/alternative'];

const TEXT_HTML_MIME = 'text/html';

/**
 * Helper function that generates a function that produces an array of matches given an HTML message
 * body.
 *
 * All these matches are appended together, and return as one array.
 *
 * Some assumptions are made here: that we are only interested in multipart messages of MIME type
 * (see array above), and that all interesting content is in the text/html mime type.
 */
export const collectMatches = <K>(messageBodyToDetected: (messageBody: string) => Array<K>) => {
    const fnToReturn = (part: gmail_v1.Schema$MessagePart): Array<K> => {
        if (part.mimeType === TEXT_HTML_MIME) {
            const emailBody = part?.body?.data;
            // have noticed that some messages don't have data, specifically when they are attachments
            if (!emailBody) {
                return [];
            }

            const buff = Buffer.from(emailBody, 'base64');
            const text = buff.toString('utf8');
            return messageBodyToDetected(text);
        } else if (part.mimeType && MULTIPART_MIMES.includes(part.mimeType)) {
            if (!part.parts) {
                return [] as Array<K>;
            }
            return part.parts
                .flatMap<K>((part: gmail_v1.Schema$MessagePart) => fnToReturn(part))
                .filter(Boolean);
        }
        return [] as Array<K>;
    };
    return fnToReturn;
};
