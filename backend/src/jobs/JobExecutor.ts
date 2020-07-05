type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs };
export class JobExecutor<JobArgs extends {}> {
    maxConcurrentJobs: number = 1;
    jobFn: (jobArgs: JobArgs) => void;
    jobQueue: Array<Job<JobArgs>> = [];
    stop: boolean = false;
    jobCounter: number = 0;
    currentlyRunningJobs: { [jobId: number]: JobArgs } = {};
    constructor(
        jobFn: (jobArgs: JobArgs) => Promise<void>,
        options?: {
            maxConcurrentJobs?: number;
        },
    ) {
        this.jobFn = jobFn;
        if (options?.maxConcurrentJobs != null) {
            this.maxConcurrentJobs = options.maxConcurrentJobs;
        }
    }
    addJob = async (jobArgs: JobArgs) => {
        this.jobQueue.push({ jobArgs, jobId: this.jobCounter });
        this.jobCounter += 1;
        this.processJobs();
        return this.jobCounter;
    };
    processJob = async (job: Job<JobArgs>) => {
        this.currentlyRunningJobs[job.jobId] = job.jobArgs;
        try {
            await this.jobFn(job.jobArgs);
        } catch (error) {
            console.error('Error processing job', job, error);
        }
        delete this.currentlyRunningJobs[job.jobId];
        this.processJobs();
    };
    stopExecutor = () => {
        this.stop = true;
    };
    processJobs = async () => {
        if (this.jobQueue.length === 0) {
            return;
        }
        if (this.maxConcurrentJobs != 0 && Object.keys(this.currentlyRunningJobs).length >= this.maxConcurrentJobs) {
            return;
        }
        const jobToRun = this.jobQueue[0];
        this.jobQueue = this.jobQueue.slice(1);
        this.processJob(jobToRun);
    };
}
