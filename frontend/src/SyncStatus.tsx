import { MailboxHome_getMailboxSyncStatus } from './__generated__/MailboxHome';
import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { SyncMailbox } from './__generated__/SyncMailbox';
import { MailboxStats, MailboxStatsVariables } from './__generated__/MailboxStats';
import { JobStatus } from './__generated__/globals';
import { format } from 'date-fns';

export const SyncStatus = (props: MailboxHome_getMailboxSyncStatus) => {
    const [syncMailbox, { loading }] = useMutation<SyncMailbox>(SYNC_MAILBOX_MUTATION);
    const { data: statsData } = useQuery<MailboxStats, MailboxStatsVariables>(STATS_QUERY, {
        variables: {
            jobId: props.id,
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
            messagesQueuedToProcess: _stats.analyzeMessage.NOT_STARTED - _stats.analyzeMessage.IN_PROGRESS,
            messagesProcessed: _stats.analyzeMessage.COMPLETED,
            messagesProcessedFailed: _stats.analyzeMessage.FAILED,
        };
    }

    return (
        <div>
            <h2>Current Sync Status for {props.userId}</h2>
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
            <div>Status of listMessages job: {props.status}</div>
            <div>listMessages job started: {format(new Date(props.createdAt * 1000), 'M/dd/yyyy HH:mm')}</div>
            <div>listMessages status updated: {format(new Date(props.updatedAt * 1000), 'M/dd/yyyy HH:mm')}</div>
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
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Download message</td>
                                <td>{stats.messagedQueuedToDownload}</td>
                                <td>{stats.messagesDownloaded}</td>
                                <td>{stats.messagesDownloadFailed}</td>
                            </tr>
                            <tr>
                                <td>Process message</td>
                                <td>{stats.messagesQueuedToProcess}</td>
                                <td>{stats.messagesProcessed}</td>
                                <td>{stats.messagesProcessedFailed}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            <button
                disabled={[JobStatus.IN_PROGRESS, JobStatus.NOT_STARTED].includes(props.status) || loading}
                onClick={() => syncMailbox()}
            >
                Sync mailbox
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
            }
            analyzeMessage {
                NOT_STARTED
                IN_PROGRESS
                COMPLETED
                FAILED
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
