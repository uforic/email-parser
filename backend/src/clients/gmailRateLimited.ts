import { createServerContext } from '../context';
import { log } from '../helpers/utils';
import { listMessages, getMessage } from './gmail';
import { GmailContext, ServerContext } from '../types';

export const client = {
    getMessage: async (context: GmailContext & ServerContext, userId: string, messageId: string) => {
        return await enqueue(context.gmailCredentials.userId, async () => {
            return await getMessage(context, userId, messageId);
        });
    },
    listMessages: async (context: GmailContext & ServerContext, userId: string, pageToken?: string) => {
        return await enqueue(
            context.gmailCredentials.userId,
            async () => {
                return await listMessages(context, userId, pageToken);
            },
            true,
        );
    },
};

let outgoingCallsByUser: {
    [userId: string]: Array<[() => Promise<any>, (data: any) => void, (error: Error) => void]>;
} = {};

// creates a promise that doesn't complete until the call has been drained and executed
const enqueue = async <K>(userId: string, call: () => Promise<K>, highPriority: boolean = false): Promise<K> => {
    return new Promise<K>((resolve, reject) => {
        let calls = outgoingCallsByUser[userId] || [];
        if (!highPriority) {
            calls.push([call, resolve, reject]);
        } else {
            // these get executed before others, "high priority"
            calls = [
                [call, resolve, reject] as [() => Promise<any>, (data: any) => void, (error: Error) => void],
            ].concat(calls);
        }
        outgoingCallsByUser[userId] = calls;
    });
};

const drainCalls = () => {
    Object.keys(outgoingCallsByUser).forEach((key) => {
        const outgoingCalls = outgoingCallsByUser[key];
        const makeCalls = outgoingCalls.splice(0, AMOUNT_PER_INTERVAL);
        log(createServerContext(), 'trace', 'draining calls for', key, makeCalls.length, outgoingCalls.length);
        makeCalls.forEach(([call, resolve, reject]) => {
            call().then(resolve).catch(reject);
        });
    });
};

// 250 units per second, 5 units per read, ~10 units per 200ms.
const DRAIN_INTERVAL_MS = 200;
const AMOUNT_PER_INTERVAL = 9;

global.setInterval(drainCalls, DRAIN_INTERVAL_MS);
