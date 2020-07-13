import { gmail_v1 } from 'googleapis';
import { parse, HTMLElement } from 'node-html-parser';
import { Context } from '../context';
import { isDefined } from '../utils';
import { LinkType, TrackerType } from '../graphql/resolvers';
import { URL } from 'url';

export const analyzeEmail = (context: Context, message: gmail_v1.Schema$Message) => {
    if (!message.payload) {
        return { linkResults: [], trackerResults: [] };
    }
    return {
        linkResults: parseMessagePartForLinks(context, message.payload),
        trackerResults: parseMessagePartForTrackers(context, message.payload),
    };
};

export type DetectedLink = {
    type: LinkType;
    href: string;
    firstCharPos: number;
};

export type DetectedTracker = {
    type: TrackerType;
    href: string;
    firstCharPos: number;
    domain: string;
};

const linkAnalyzer = (urlRegex: RegExp, linkElement: HTMLElement) => {
    const href = linkElement.getAttribute('href');
    if (!href) {
        return;
    }
    if (!urlRegex.exec(href)) {
        return undefined;
    }
    return href;
};

const imageAnalyzer = (linkElement: HTMLElement) => {
    const height = linkElement.getAttribute('height');
    const width = linkElement.getAttribute('width');
    const href = linkElement.getAttribute('src');
    if (!height || !width || !href) {
        return;
    }
    if (height === '1' && width === '1')
        return {
            domain: new URL(href).hostname,
            href,
        };
    return undefined;
};

const linkAnalysisConfigs = [
    {
        type: LinkType.GoogleDrive,
        urlRegex: /https:\/\/drive.google.com\/file\/d\//,
    },
    {
        type: LinkType.GoogleDocs,
        urlRegex: /https:\/\/docs.google.com\/document\/d/,
    },
];

const parseMessagePartForLinks = (context: Context, part: gmail_v1.Schema$MessagePart): Array<DetectedLink> => {
    if (part.mimeType === 'text/html') {
        const emailBody = part?.body?.data;
        // have noticed that some messages don't have data, specifically when they are attachments
        if (!emailBody) {
            return [];
        }

        const buff = Buffer.from(emailBody, 'base64');
        const text = buff.toString('ascii');
        const rootElement = parse(text);
        const links = rootElement.querySelectorAll('a');
        const detectedLinks = linkAnalysisConfigs.flatMap((config) =>
            links
                .map((link) => linkAnalyzer(config.urlRegex, link))
                .filter(isDefined)
                .map(
                    (match) => ({ href: match, type: config.type, firstCharPos: text.indexOf(match) } as DetectedLink),
                ),
        );
        return detectedLinks;
    } else if (
        part.mimeType === 'multipart/mixed' ||
        part.mimeType === 'multipart/related' ||
        part.mimeType == 'multipart/alternative'
    ) {
        if (!part.parts) {
            return [];
        }
        return part.parts.flatMap((part: gmail_v1.Schema$MessagePart) => parseMessagePartForLinks(context, part));
    }
    return [];
};

const parseMessagePartForTrackers = (context: Context, part: gmail_v1.Schema$MessagePart): Array<DetectedTracker> => {
    if (part.mimeType === 'text/html') {
        const emailBody = part?.body?.data;
        // have noticed that some messages don't have data, specifically when they are attachments
        if (!emailBody) {
            return [];
        }

        const buff = Buffer.from(emailBody, 'base64');
        const text = buff.toString('ascii');
        const rootElement = parse(text);
        const images = rootElement.querySelectorAll('img');
        const detectedTrackers = images
            .map((link) => imageAnalyzer(link))
            .filter(isDefined)
            .map(
                (match) =>
                    ({
                        ...match,
                        type: TrackerType.Onebyone,
                        firstCharPos: text.indexOf(match.href),
                    } as DetectedTracker),
            );

        return detectedTrackers;
    } else if (
        part.mimeType === 'multipart/mixed' ||
        part.mimeType === 'multipart/related' ||
        part.mimeType == 'multipart/alternative'
    ) {
        if (!part.parts) {
            return [];
        }
        return part.parts.flatMap((part: gmail_v1.Schema$MessagePart) => parseMessagePartForTrackers(context, part));
    }
    return [];
};
