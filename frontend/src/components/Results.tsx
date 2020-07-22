import React from 'react';
import { MailboxHome, MailboxHome_getResultsPage_results_data } from './__generated__/MailboxHome';
import { LinkType, TrackerType } from '../__generated__/globals';

export const Results = (props: {
    data: MailboxHome;
    onClickMessage: (messageId: string, charPos?: number) => void;
}) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Message ID</th>
                    <th>Analysis type</th>
                    <th>Analysis summary</th>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Preview</th>
                </tr>
            </thead>
            <tbody>
                {props.data.getResultsPage.results.map((result) => {
                    return (
                        <tr key={result.id}>
                            <td>{result.messageId}</td>
                            <td>{analysisTypeToDisplay(result.data.__typename)}</td>
                            <td>
                                <AnalysisSummary analysisType={result.data} />
                            </td>
                            <td>{result.meta?.from}</td>
                            <td>{result.meta?.subject?.slice(0, 50)}</td>
                            <td>
                                <button
                                    onClick={() => props.onClickMessage(result.messageId, getFirstCharPos(result.data))}
                                >
                                    Preview message
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

const analysisTypeToDisplay = (analysisType: 'TrackingData' | 'LinkData') => {
    if (analysisType === 'LinkData') {
        return 'Unsecured link';
    } else if (analysisType === 'TrackingData') {
        return 'Tracking pixel detection';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    analysisType as never;
};

const AnalysisSummary = (props: { analysisType: MailboxHome_getResultsPage_results_data }) => {
    const { analysisType } = props;
    if (analysisType.__typename === 'LinkData') {
        return (
            <ul>
                {analysisType.linkResults.map((data, idx) => {
                    return (
                        <li key={idx}>
                            <span>{linkTypeToDisplay(data.type)}</span>
                            <span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.href);
                                    }}
                                >
                                    Copy URL
                                </button>
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    } else if (analysisType.__typename === 'TrackingData') {
        return (
            <ul>
                {analysisType.trackingResults.map((data, idx) => {
                    return (
                        <li key={idx}>
                            <span>
                                {trackingTypeToDisplay(data.type)}:{data.domain}
                            </span>
                            <span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.href);
                                    }}
                                >
                                    Copy URL
                                </button>
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const foo: never = analysisType;
    return null;
};

const getFirstCharPos = (analysis: MailboxHome_getResultsPage_results_data) => {
    if (analysis.__typename === 'LinkData') {
        return analysis.linkResults
            .map((result) => result.firstCharPos)
            .filter((charPos) => charPos != null && charPos >= 0)[0];
    } else if (analysis.__typename === 'TrackingData') {
        console.log(analysis.trackingResults.map((result) => result.firstCharPos));
        return analysis.trackingResults
            .map((result) => result.firstCharPos)
            .filter((charPos) => charPos != null && charPos >= 0)[0];
    }
    return undefined;
};

const linkTypeToDisplay = (linkType: LinkType) => {
    if (linkType === LinkType.GOOGLE_DOCS) {
        return 'Google Docs';
    } else if (linkType === LinkType.GOOGLE_DRIVE) {
        return 'Google Drive';
    } else if (linkType === LinkType.UNKNOWN) {
        return 'Unknown';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const foo: never = linkType;
};

const trackingTypeToDisplay = (trackerType: TrackerType) => {
    if (trackerType === TrackerType.ONEBYONE) {
        return '1x1 pixel';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const foo: TrackerType.UNKNOWN = trackerType;
};
