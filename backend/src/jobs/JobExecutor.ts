import {
    markJobFailed,
    JobType,
    addJob,
    getFreshJobAndMarkInProgress,
    getNumberOfCurrentlyRunningJobs,
} from '../store';

type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs; userId: string };
export class JobExecutor<JobArgs extends {}> {
    maxConcurrentJobs: number = 1;
    jobFn: (userId: string, jobArgs: JobArgs) => void;
    jobType: JobType;
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
    addJob = async (userId: string, jobArgs: JobArgs) => {
        await addJob(userId, this.jobType, jobArgs);
        this.processJobs();
    };
    processJob = async (job: Job<JobArgs>) => {
        try {
            await this.jobFn(job.userId, job.jobArgs);
        } catch (error) {
            await markJobFailed(job.jobId);
            console.error('Error processing job', job, error);
        }
        this.processJobs();
    };
    processJobs = async () => {
        if (
            this.maxConcurrentJobs != 0 &&
            (await getNumberOfCurrentlyRunningJobs(this.jobType)) >= this.maxConcurrentJobs
        ) {
            return;
        }
        const job = await getFreshJobAndMarkInProgress(this.jobType);
        if (!job) {
            return;
        }

        this.processJob({
            jobArgs: JSON.parse(job.args),
            jobId: job.id,
            userId: job.userId,
        });
    };
}
