import { AssertionError } from 'assert';
import { gmail_v1 } from 'googleapis';

export function assertDefined(condition: any): asserts condition {
    if (condition == null) {
        throw new AssertionError();
    }
}

export function isDefined<K>(n: K | null | undefined): n is K {
    return n != null;
}

const MULTIPART_MIMES = ['multipart/mixed', 'multipart/related', 'multipart/alternative'];

const TEXT_HTML_MIME = 'text/html';

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
