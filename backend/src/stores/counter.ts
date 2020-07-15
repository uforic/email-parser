import { JobType } from '../types';
import { JobStatus } from '../graphql/resolvers';

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
    analyzeMessage: { ...INIT_JOB_STATS },
    syncMailbox: { ...INIT_JOB_STATS },
    downloadMessage: { ...INIT_JOB_STATS },
});

const counter: Record<number, JobCounter> = {};

export const getCounter = (jobId: number): JobCounter | undefined => {
    const jobCounters = counter[jobId];
    return jobCounters;
};

export const initCounters = (counters: Array<{ parentId: number; type: JobType; cnt: number }>) => {
    counters.forEach((counter) => {
        addCount(counter.parentId, counter.type, JobStatus.NotStarted, counter.cnt);
    });
};

export const clearCounter = (jobId: number) => {
    delete counter[jobId];
};

export const addCount = (parentJobId: number, key: JobType, subkey: JobStatus | 'timeSpent', value: number = 1) => {
    let parentJobGroup = counter[parentJobId];
    if (!parentJobGroup) {
        parentJobGroup = INIT_SYNC_STATE();
    }
    parentJobGroup[key][subkey] += value;
    counter[parentJobId] = parentJobGroup;
};
