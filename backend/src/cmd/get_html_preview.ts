import { gmail_v1 } from 'googleapis';
import { Context } from '../context';
import { collectMatches } from '../utils';

/**
 * Sometimes, the frontend wants to extract a message preview
 * around a search result. Simple provide the charPos, and we
 *
 * There are some simplifying assumptions made: we assume there
 * is probably only one text/html part, and we assume that is the
 * part we want to slice(charPos - 200, charPos + 200) on.
 *
 * Future implementation: Figure out how to store the path to a "part",
 * and have the search results store not just charPos, but also "partId".
 */
export const getMessagePreview = (context: Context, message: gmail_v1.Schema$Message, charPos: number) => {
    if (!message.payload) {
        return { matchPreview: [] };
    }

    return {
        matchPreview: getPreviewAroundCharPos(message.payload, charPos),
    };
};

const LOOK_AHEAD = 200;

const getPreviewAroundCharPos = (part: gmail_v1.Schema$MessagePart, charPos: number) => {
    return collectMatches((text) => {
        const matchSlice = text.slice(Math.max(charPos - LOOK_AHEAD, 0), charPos + LOOK_AHEAD);
        return [matchSlice];
    })(part);
};
