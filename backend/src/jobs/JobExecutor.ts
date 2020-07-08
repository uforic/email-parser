import { markJobFailed, JobType, addJobs, getFreshJobAndMarkInProgress } from '../store';

type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs; userId: string };
export class JobExecutor<JobArgs extends {}> {
    maxConcurrentJobs: number = 1;
    jobFn: (userId: string, jobArgs: JobArgs) => void;
    jobType: JobType;
    currentlyRunningJobs = 0;
    constructor(
        jobFn: (userId: string, jobArgs: JobArgs) => Promise<void>,
        jobType: JobType,
        options?: {
            maxConcurrentJobs?: number;
        },
    ) {
        this.jobFn = jobFn;
        this.jobType = jobType;
        if (options?.maxConcurrentJobs != null) {
            this.maxConcurrentJobs = options.maxConcurrentJobs;
        }
    }
    addJobs = async (userId: string, jobArgs: Array<JobArgs>) => {
        await addJobs(jobArgs.map((args) => ({ userId, type: this.jobType, jobArgs: args })));
        this.processJobs();
    };
    processJob = async (job: Job<JobArgs>) => {
        this.currentlyRunningJobs += 1;
        try {
            await this.jobFn(job.userId, job.jobArgs);
        } catch (error) {
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
            });
        });
    };
}
