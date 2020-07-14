import { markJobFailed, addJobs, getFreshJobAndMarkInProgress, markJobComplete } from '../stores/store';
import { JobType } from '../types';
import { addCount } from '../stores/counter';
import { JobStatus } from '../graphql/resolvers';

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
            addCount(statsId, this.jobType, JobStatus.InProgress, 1);
            await this.jobFn(job);
            addCount(statsId, this.jobType, JobStatus.Completed, 1);
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

    processJobs = async () => {
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

    start = async () => {
        return await this.processJobs();
    };
}
