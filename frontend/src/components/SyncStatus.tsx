import { MailboxHome_getMailboxSyncStatus } from './__generated__/MailboxHome';
import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { SyncMailbox } from './__generated__/SyncMailbox';
import { ClearJobs, ClearJobsVariables } from './__generated__/ClearJobs';
import { MailboxStats, MailboxStatsVariables } from './__generated__/MailboxStats';
import { JobStatus } from '../__generated__/globals';
import { format } from 'date-fns';

function isDefined<K>(n: K | null | undefined): n is K {
    return n != null;
}

export const SyncStatus = (props: { data: MailboxHome_getMailboxSyncStatus; refetchStatus: () => void }) => {
    const { data } = props;
    const [syncMailbox, { loading }] = useMutation<SyncMailbox>(SYNC_MAILBOX_MUTATION);
    const [clearJobs] = useMutation<ClearJobs, ClearJobsVariables>(CLEAR_JOBS_MUTATION);
    const { data: statsData } = useQuery<MailboxStats, MailboxStatsVariables>(STATS_QUERY, {
        variables: {
            jobId: data.id,
        },
        pollInterval: 5000,
    });
    const _stats = statsData?.getMailboxSyncStats;
    let stats;
    if (_stats != null) {
        stats = {
            messagedQueuedToDownload: _stats.downloadMessage.NOT_STARTED - _stats.downloadMessage.IN_PROGRESS,
            messagesDownloaded: _stats.downloadMessage.COMPLETED,
            messagesDownloadFailed: _stats.downloadMessage.FAILED,
            messageDownloadTimePerJob: Math.round(_stats.downloadMessage.timeSpent / _stats.downloadMessage.COMPLETED),
            messagesQueuedToProcess: _stats.analyzeMessage.NOT_STARTED - _stats.analyzeMessage.IN_PROGRESS,
            messagesProcessed: _stats.analyzeMessage.COMPLETED,
            messagesProcessedFailed: _stats.analyzeMessage.FAILED,
            messageProcessedTimeSpent: Math.round(_stats.analyzeMessage.timeSpent / _stats.analyzeMessage.COMPLETED),
        };
    }

    // disable if we are loading, the add messages job is going, or we have pending jobs to process
    const syncButtonDisabled =
        [JobStatus.IN_PROGRESS, JobStatus.NOT_STARTED].includes(data.status) ||
        loading ||
        [stats?.messagedQueuedToDownload, stats?.messagesQueuedToProcess].filter(isDefined).filter((elem) => elem > 0)
            .length > 0;

    const clearJobsDisabled =
        [stats?.messagedQueuedToDownload, stats?.messagesQueuedToProcess].filter(isDefined).filter((elem) => elem > 0)
            .length === 0;

    return (
        <div>
            <h2>Current Sync Status for {data.userId}</h2>
            <p>
                There are three jobs: list message, message download, and process message. You can only run one list
                message job at a time per authenticated user.
            </p>

            <p>
                After the list message job completes, it may take some time to finish the rest of the jobs (watch
                counter to see jobs drain).
            </p>
            <p>
                Refresh the page to get the latest results. Result ordering is maintained, so once the first page fills,
                there is no need to refresh anymore.
            </p>
            <h3>List messages job progress</h3>
            <div>Status: {data.status}</div>
            <div>Start: {format(new Date(data.createdAt * 1000), 'M/dd/yyyy HH:mm')}</div>
            <div>Updated: {format(new Date(data.updatedAt * 1000), 'M/dd/yyyy HH:mm')}</div>
            {stats && (
                <div>
                    <h3>Job progress:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Job Name</th>
                                <th>Queued</th>
                                <th>Succeeded</th>
                                <th>Failed</th>
                                <th>Average time per job</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Download message</td>
                                <td>{stats.messagedQueuedToDownload}</td>
                                <td>{stats.messagesDownloaded}</td>
                                <td>{stats.messagesDownloadFailed}</td>
                                <td>{stats.messageDownloadTimePerJob} ms</td>
                            </tr>
                            <tr>
                                <td>Process message</td>
                                <td>{stats.messagesQueuedToProcess}</td>
                                <td>{stats.messagesProcessed}</td>
                                <td>{stats.messagesProcessedFailed}</td>
                                <td>{stats.messageProcessedTimeSpent} ms</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            <button
                disabled={syncButtonDisabled}
                onClick={() => {
                    syncMailbox();
                    props.refetchStatus();
                }}
            >
                Sync mailbox
            </button>
            <button
                disabled={clearJobsDisabled}
                onClick={() =>
                    clearJobs({
                        variables: {
                            parentJobId: props.data.id,
                        },
                    })
                }
            >
                Clear queued jobs
            </button>
        </div>
    );
};

const STATS_QUERY = gql`
    query MailboxStats($jobId: ID!) {
        getMailboxSyncStats(jobId: $jobId) {
            downloadMessage {
                NOT_STARTED
                IN_PROGRESS
                COMPLETED
                FAILED
                timeSpent
            }
            analyzeMessage {
                NOT_STARTED
                IN_PROGRESS
                COMPLETED
                FAILED
                timeSpent
            }
        }
    }
`;

const SYNC_MAILBOX_MUTATION = gql`
    mutation SyncMailbox {
        mailbox {
            syncMailbox
        }
    }
`;

const CLEAR_JOBS_MUTATION = gql`
    mutation ClearJobs($parentJobId: ID!) {
        mailbox {
            clearJobs(parentJobId: $parentJobId)
        }
    }
`;
