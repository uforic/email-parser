import { gmail_v1 } from 'googleapis';
import { parse, HTMLElement } from 'node-html-parser';
import { ServerContext } from '../types';
import { isDefined, collectMatches, asyncFilter } from '../helpers/utils';

import { URL } from 'url';
import { checkDriveLink as _checkDriveLink } from './check_drive_link';
import memoize from 'lodash.memoize';
import { LinkType, TrackerType } from '../graphql/__generated__/resolvers';
import { DetectedTracker, DetectedLink } from '../types';

// memoize to avoid double requesting the same link twice
const checkDriveLink = memoize(_checkDriveLink);

/**
 * Given a Gmail message, find all unsecured links and 1x1 trackers in it.
 *
 * If an error occurs in either analysis, then the whole analysis fails.
 *
 * Known issues: The node-html-parser we are using occasionally mangles the URL
 * for <img or <a tags. This will prevent us from finding the firstCharPos, since
 * when we do a string match, the mangled string doesn't match.
 *
 *
 * Example mangling:
 * NoDedup¬ificationId -- this is what comes out of the HTMLElement.getAttribute
 * NoDedup&notificationId -- this is what comes from Base64 decode
 *
 * Todo: Is there a better way to go from HTML DOM node to charPos?
 *
 * Todo: Find another library that doesn't mangle URLs
 */
export const analyzeEmail = async (context: ServerContext, message: gmail_v1.Schema$Message) => {
    if (!message.payload) {
        return { linkResults: [], trackerResults: [] };
    }

    const unfilteredLinkResults = parseMessagePartForLinks(message.payload);

    const linkResults = await asyncFilter(
        unfilteredLinkResults,
        async (result) => (await checkDriveLink(result.href)).ok,
    );

    return {
        linkResults,
        trackerResults: parseMessagePartForTrackers(message.payload),
    };
};

// checks if a given link element match the URL regex, and does it have an href
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

// checks if a given image has a valid src, and is 1x1
const imageAnalyzer = (linkElement: HTMLElement) => {
    const height = linkElement.getAttribute('height');
    const width = linkElement.getAttribute('width');
    const href = linkElement.getAttribute('src');
    if (!height || !width || !href) {
        return;
    }
    try {
        const hostname = new URL(href).hostname;
        if (height === '1' && width === '1') {
            return {
                domain: hostname,
                href,
            };
        }
    } catch (error) {
        // if the tracking pixel image is not a well formed URL,
        // then assume it can't be malicious
        return undefined;
    }
    return undefined;
};

// probably an abastraction too soon... but put a link pattern here, to have it start scanning for it
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

const parseMessagePartForLinks = collectMatches((messageBody: string) => {
    const rootElement = parse(messageBody);
    const links = rootElement.querySelectorAll('a');
    const detectedLinks = linkAnalysisConfigs.flatMap((config) =>
        links
            .map((link) => linkAnalyzer(config.urlRegex, link))
            .filter(isDefined)
            .map(
                (match) =>
                    ({ href: match, type: config.type, firstCharPos: messageBody.indexOf(match) } as DetectedLink),
            ),
    );
    return detectedLinks;
});

const parseMessagePartForTrackers = collectMatches((messageBody: string) => {
    const rootElement = parse(messageBody);
    const images = rootElement.querySelectorAll('img');
    const detectedTrackers = images
        .map((link) => imageAnalyzer(link))
        .filter(isDefined)
        .map(
            (match) =>
                ({
                    ...match,
                    type: TrackerType.Onebyone,
                    firstCharPos: messageBody.indexOf(match.href),
                } as DetectedTracker),
        );

    return detectedTrackers;
});
