import { gmail_v1 } from 'googleapis';
import { parse, HTMLElement } from 'node-html-parser';
import { Context } from '../context';

export const parseEmail = (context: Context, message: gmail_v1.Schema$Message) => {
    if (message.payload.mimeType === 'multipart/mixed') {
        return message.payload.parts.map(parseMessagePart.bind(null, context));
    }
    return {};
};

type DetectedLink = {
    type: string;
    href: string;
    firstCharPos: number;
};

const linkAnalyzer = (urlRegex: RegExp, linkElement: HTMLElement): string => {
    const href = linkElement.getAttribute('href');
    if (!urlRegex.exec(href)) {
        return undefined;
    }
    return href;
};

const linkAnalysisConfigs = [
    {
        type: 'googleDrive',
        urlRegex: /http/,
    },
];

const parseMessagePart = (context: Context, messagePart: gmail_v1.Schema$MessagePart): Array<DetectedLink> => {
    return messagePart.parts.flatMap((part) => {
        if (part.mimeType === 'text/html') {
            const buff = new Buffer(part.body.data, 'base64');
            const text = buff.toString('ascii');
            const rootElement = parse(text);
            const links = rootElement.querySelectorAll('a');
            const detectedLinks = linkAnalysisConfigs.flatMap((config) =>
                links
                    .map((link) => linkAnalyzer(config.urlRegex, link))
                    .filter(Boolean)
                    .map(
                        (match) =>
                            ({ href: match, type: config.type, firstCharPos: text.indexOf(match) } as DetectedLink),
                    ),
            );
            return detectedLinks;
        } else if (part.mimeType === 'multipart/mixed' || part.mimeType === 'multipart/related') {
            return part.parts.flatMap((part: gmail_v1.Schema$MessagePart) => parseMessagePart(context, part));
        }
        return [];
    });
};
