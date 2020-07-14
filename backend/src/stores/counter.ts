import { JobType } from '../types';
import { JobStatus } from '../graphql/resolvers';

const INIT_JOB_STATS = {
    [JobStatus.Completed]: 0,
    [JobStatus.Failed]: 0,
    [JobStatus.InProgress]: 0,
    [JobStatus.NotStarted]: 0,
    [JobStatus.Unknown]: 0,
};

type JobStats = Record<JobStatus, number>;

type JobCounter = Record<JobType, JobStats>;

const INIT_SYNC_STATE: JobCounter = {
    analyzeMessage: { ...INIT_JOB_STATS },
    syncMailbox: { ...INIT_JOB_STATS },
    downloadMessage: { ...INIT_JOB_STATS },
};

const counter: Record<number, JobCounter> = {};

export const getCounter = (jobId: number): JobCounter | undefined => {
    const jobCounters = counter[jobId];
    return jobCounters;
};

export const addCount = (parentJobId: number, key: JobType, subkey: JobStatus, value: number = 1) => {
    let userIdState = counter[parentJobId];
    if (!userIdState) {
        userIdState = { ...INIT_SYNC_STATE };
    }
    userIdState[key][subkey] += value;
    counter[parentJobId] = userIdState;
};
