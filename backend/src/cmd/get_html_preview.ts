import { gmail_v1 } from 'googleapis';
import { Context } from '../context';

export const getMessagePreview = (context: Context, message: gmail_v1.Schema$Message, charPos: number) => {
    if (!message.payload) {
        return { matchPreview: undefined };
    }

    return {
        matchPreview: getPreviewAroundCharPos(context, message.payload, charPos),
    };
};

const LOOK_AHEAD = 200;

const getPreviewAroundCharPos = (
    context: Context,
    part: gmail_v1.Schema$MessagePart,
    charPos: number,
): string | undefined => {
    if (part.mimeType === 'text/html') {
        const emailBody = part?.body?.data;
        // have noticed that some messages don't have data, specifically when they are attachments
        if (!emailBody) {
            return undefined;
        }

        const buff = Buffer.from(emailBody, 'base64');

        const text = buff.toString('utf8');
        console.log('EXTRACTING FROM HTML', charPos, text.length);
        return text.slice(charPos - LOOK_AHEAD, charPos + LOOK_AHEAD);
    } else if (
        part.mimeType === 'multipart/mixed' ||
        part.mimeType === 'multipart/related' ||
        part.mimeType == 'multipart/alternative'
    ) {
        if (!part.parts) {
            return undefined;
        }
        return part.parts
            .map((part: gmail_v1.Schema$MessagePart) => getPreviewAroundCharPos(context, part, charPos))
            .filter(Boolean)[0];
    }
    return undefined;
};
