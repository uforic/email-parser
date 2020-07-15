import { markJobFailed, addJobs, getFreshJobAndMarkInProgress, markJobComplete } from '../stores/store';
import { JobType } from '../types';
import { addCount } from '../stores/counter';
import { JobStatus } from '../graphql/resolvers';
import debounce from 'lodash.debounce';

type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs; userId: string; parentId: number | null };
export class JobExecutor<JobArgs extends {}> {
    maxConcurrentJobs: number;
    jobFn: (job: Job<JobArgs>) => void;
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
        this.processJobs();
    };
    processJob = async (job: Job<JobArgs>) => {
        this.currentlyRunningJobs += 1;
        const statsId = job.parentId != null ? job.parentId : job.jobId;
        try {
            const startTime = Date.now();
            addCount(statsId, this.jobType, JobStatus.InProgress, 1);
            await this.jobFn(job);
            addCount(statsId, this.jobType, JobStatus.Completed, 1);
            addCount(statsId, this.jobType, 'timeSpent', Date.now() - startTime);
            await markJobComplete(job.jobId);
        } catch (error) {
            addCount(statsId, this.jobType, JobStatus.Failed, 1);
            await markJobFailed(job.jobId);
            console.error('Error processing job', job, error);
        } finally {
            this.currentlyRunningJobs -= 1;
        }
        this.processJobs();
    };

    _processJobs = async () => {
        if (this.maxConcurrentJobs != 0 && this.currentlyRunningJobs >= this.maxConcurrentJobs) {
            return;
        }
        const jobsToTake = this.maxConcurrentJobs - this.currentlyRunningJobs;
        const jobs = await getFreshJobAndMarkInProgress(this.jobType, jobsToTake);
        if (jobs.length == 0) {
            return;
        }

        jobs.forEach((job) => {
            this.processJob({
                jobArgs: JSON.parse(job.args),
                jobId: job.id,
                userId: job.userId,
                parentId: job.parentId,
            });
        });
    };

    // we debounce this because we call it excessively, but
    // only need to check for new jobs occasionally
    processJobs = debounce(this._processJobs, 10);

    start = async () => {
        return await this.processJobs();
    };
}
