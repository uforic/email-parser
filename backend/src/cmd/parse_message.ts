import { gmail_v1 } from 'googleapis';
import { parse } from 'node-html-parser';
import { Context } from '../context';

export const parseEmail = (context: Context, message: gmail_v1.Schema$Message) => {
    if (message.payload.mimeType === 'multipart/mixed') {
        return message.payload.parts.map(parseMessagePart.bind(null, context));
    }
    return {};
};

// @ts-ignore
const parseMessagePart = (context: Context, messagePart: gmail_v1.Schema$MessagePart) => {
    return messagePart.parts.map((part) => {
        if (part.mimeType === 'text/html') {
            const buff = new Buffer(part.body.data, 'base64');
            const text = buff.toString('ascii');
            const rootElement = parse(text);
            const links = rootElement.querySelectorAll('a');
            return links.map((link) => link.getAttribute('href'));
        } else if (part.mimeType === 'multipart/mixed' || part.mimeType === 'multipart/related') {
            return part.parts.map((part: gmail_v1.Schema$MessagePart) => parseMessagePart(context, part));
        }
    });
};
