import { JobStatus, JobType } from '../graphql/__generated__/resolvers';

/**
 * To maintain a count of jobs going on for a user,
 * we store counts of the various states of jobs in this class.
 *
 * They are all stored in this variable, keyed by parent job ID
 * (the highest parent is the "listMessages" parent, all other jobs
 * derive from this.)
 */
const COUNTERS: Record<number, JobCounter> = {};

const INIT_JOB_STATS = {
    [JobStatus.Completed]: 0,
    [JobStatus.Failed]: 0,
    [JobStatus.InProgress]: 0,
    [JobStatus.NotStarted]: 0,
    [JobStatus.Unknown]: 0,
    timeSpent: 0,
};

type JobStats = Record<JobStatus | 'timeSpent', number>;

type JobCounter = Record<JobType, JobStats>;

const INIT_SYNC_STATE: () => JobCounter = () => ({
    [JobType.AnalyzeMessage]: { ...INIT_JOB_STATS },
    [JobType.SyncMailbox]: { ...INIT_JOB_STATS },
    [JobType.DownloadMessage]: { ...INIT_JOB_STATS },
    [JobType.Unknown]: { ...INIT_JOB_STATS },
});

export const getCounter = (jobId: number): JobCounter | undefined => {
    const jobCounters = COUNTERS[jobId];
    return jobCounters;
};

export const initCounters = (counters: Array<{ parentId: number; type: JobType; cnt: number }>) => {
    counters.forEach((counter) => {
        addCount(counter.parentId, counter.type, JobStatus.NotStarted, counter.cnt);
    });
};

export const clearCounter = (jobId: number) => {
    delete COUNTERS[jobId];
};

export const addCount = (parentJobId: number, key: JobType, subkey: JobStatus | 'timeSpent', value: number = 1) => {
    let parentJobGroup = COUNTERS[parentJobId];
    if (!parentJobGroup) {
        parentJobGroup = INIT_SYNC_STATE();
    }
    parentJobGroup[key][subkey] += value;
    COUNTERS[parentJobId] = parentJobGroup;
};
