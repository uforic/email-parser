import { GmailContext } from '../context';
import { listMessages, getMessage } from '../clients/gmail';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assertDefined } from '../utils';

export const syncMailbox = async (
    context: GmailContext,
    userId: string,
    cacheDirectory: string,
    options: {
        // for debugging, if you want to only sync n messages
        maxPages?: number;
    },
) => {
    if (!existsSync(cacheDirectory)) {
        mkdirSync(cacheDirectory);
    }

    let pageCount = 0;

    const gmailGetExecutor = new JobExecutor<{ id: string }>(
        async ({ id }) => {
            const messagePath = join(cacheDirectory, id + '.json');
            if (existsSync(messagePath)) {
                console.log('ALREADY');
                return;
            }
            const message = await getMessage(context, userId, id);
            writeFileSync(messagePath, JSON.stringify(message));
        },
        { maxConcurrentJobs: 5 },
    );
    const gmailListExecutor = new JobExecutor<{ userId: string; pageToken?: string }>(async (args) => {
        const { messages, nextPageToken } = await listMessages(context, args.userId, args.pageToken);
        assertDefined(messages);
        pageCount += 1;
        messages.forEach(({ id }) => {
            assertDefined(id);
            gmailGetExecutor.addJob({ id });
        });
        if (!options.maxPages || pageCount <= options.maxPages) {
            console.log('max pages hit');
            return;
        }
        if (nextPageToken) {
            gmailListExecutor.addJob({ userId, pageToken: nextPageToken });
        }
    });

    gmailListExecutor.addJob({ userId });
};

type Job<JobArgs extends {}> = { jobId: number; jobArgs: JobArgs };
class JobExecutor<JobArgs extends {}> {
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
        if (Object.keys(this.currentlyRunningJobs).length >= this.maxConcurrentJobs) {
            return;
        }
        const jobToRun = this.jobQueue[0];
        this.jobQueue = this.jobQueue.slice(1);
        this.processJob(jobToRun);
    };
}
