import { markJobFailed, addJobs, getFreshJobAndMarkInProgress, markJobComplete } from '../stores/store';
import { JobType } from '../types';
import { addCount } from '../stores/counter';
import { JobStatus } from '../graphql/resolvers';

type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs; userId: string; parentId: number | null };
export class JobExecutor<JobArgs extends {}> {
    maxConcurrentJobs: number;
    jobFn: (job: Job<JobArgs>) => Promise<void>;
    jobType: JobType;
    currentlyRunningJobs = 0;
    constructor(
        jobFn: (job: Job<JobArgs>) => Promise<void>,
        jobType: JobType,
        options: {
            maxConcurrentJobs: number;
        },
    ) {
        this.jobFn = jobFn;
        this.jobType = jobType;
        this.maxConcurrentJobs = options.maxConcurrentJobs || 1;
    }
    addJobs = async (userId: string, parentId: number | null, jobArgs: Array<JobArgs>) => {
        if (parentId != null) {
            addCount(parentId, this.jobType, JobStatus.NotStarted, jobArgs.length);
        }
        await addJobs(jobArgs.map((args) => ({ userId, type: this.jobType, jobArgs: args, parentId })));
    };
    processJob = async (job: Job<JobArgs>): Promise<void> => {
        const statsId = job.parentId != null ? job.parentId : job.jobId;
        try {
            const startTime = Date.now();
            addCount(statsId, this.jobType, JobStatus.InProgress, 1);
            await this.jobFn(job);
            addCount(statsId, this.jobType, JobStatus.Completed, 1);
            addCount(statsId, this.jobType, 'timeSpent', Date.now() - startTime);
            markJobComplete(job.jobId);
        } catch (error) {
            addCount(statsId, this.jobType, JobStatus.Failed, 1);
            await markJobFailed(job.jobId);
            console.error('Error processing job', job, error);
        } finally {
            this.currentlyRunningJobs -= 1;
        }
    };

    _processJobs = async () => {
        if (this.maxConcurrentJobs != 0 && this.currentlyRunningJobs >= this.maxConcurrentJobs) {
            return;
        }

        const jobsToTake = this.maxConcurrentJobs - this.currentlyRunningJobs;
        const jobs = await getFreshJobAndMarkInProgress<JobArgs>(this.jobType, jobsToTake);
        if (jobs.length == 0) {
            return;
        }
        this.currentlyRunningJobs += jobs.length;
        jobs.forEach((job) => {
            this.processJob({
                jobArgs: job.jobArgs,
                jobId: job.id,
                userId: job.userId,
                parentId: job.parentId,
            });
        });
    };

    setStuff = () => {
        return setTimeout(() => {
            this._processJobs().finally(() => this.setStuff());
        }, POLL_INTERVAL_MS);
    };

    start = async () => {
        this.setStuff();
    };
}

const POLL_INTERVAL_MS = 50;
