import { google } from 'googleapis';
import { ServerContext, GmailContext } from '../types';
import jwtDecode from 'jwt-decode';
import { log } from '../helpers/utils';
import { createServerContext } from '../context';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'];

const getOauth2Client = (context: ServerContext) => {
    const oAuth2Client = new google.auth.OAuth2(
        context.env.gmailClientId,
        context.env.gmailClientSecret,
        context.env.gmailRedirectUrl,
    );
    return oAuth2Client;
};

export const getOauth2Url = (context: ServerContext) => {
    const oauth2Client = getOauth2Client(context);
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    return authUrl;
};

export const getToken = async (context: ServerContext, code: string) => {
    const oauth2Client = getOauth2Client(context);
    const { tokens } = await oauth2Client.getToken(code);
    const decodedIdToken: { email: string } = jwtDecode(tokens.id_token as string);
    return { access_token: tokens.access_token, userId: decodedIdToken.email, refresh_token: tokens.refresh_token };
};

const getGmailClient = (context: GmailContext & ServerContext) => {
    const oauth2Client = getOauth2Client(context);
    oauth2Client.setCredentials({
        access_token: context.gmailCredentials.accessToken,
        refresh_token: context.gmailCredentials.refreshToken,
    });
    const gmailClient = google.gmail({
        auth: oauth2Client,
        version: 'v1',
    });
    return gmailClient;
};

export const listMessages = async (context: GmailContext & ServerContext, userId: string, pageToken?: string) => {
    const gmailClient = getGmailClient(context);
    const initialPayloadPromise = () =>
        gmailClient.users.messages.list({
            userId: userId,
            pageToken,
            maxResults: 200,
        });
    const initialPayload = await prequeue(context.gmailCredentials.userId, initialPayloadPromise);
    return initialPayload.data;
};

let outgoingCallsByUser: {
    [userId: string]: Array<[() => Promise<any>, (data: any) => void, (error: Error) => void]>;
} = {};

// creates a promise that doesn't complete until the call has been drained and executed
const enqueue = async <K>(userId: string, call: () => Promise<K>): Promise<K> => {
    return new Promise<K>((resolve, reject) => {
        const calls = outgoingCallsByUser[userId] || [];
        calls.push([call, resolve, reject]);
        outgoingCallsByUser[userId] = calls;
    });
};

// like enqueue, but puts it at the beginning of the list
const prequeue = async <K>(userId: string, call: () => Promise<K>): Promise<K> => {
    return new Promise<K>((resolve, reject) => {
        const calls = outgoingCallsByUser[userId] || [];
        outgoingCallsByUser[userId] = [
            [call, resolve, reject] as [() => Promise<any>, (data: any) => void, (error: Error) => void],
        ].concat(calls);
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

const DRAIN_INTERVAL_MS = 200;
const AMOUNT_PER_INTERVAL = 9;

global.setInterval(drainCalls, DRAIN_INTERVAL_MS);

export const getMessage = async (context: GmailContext & ServerContext, userId: string, messageId: string) => {
    const gmailClient = getGmailClient(context);

    const fn = () =>
        gmailClient.users.messages.get({
            userId,
            id: messageId,
        });

    const response = await enqueue(context.gmailCredentials.userId, fn);

    return response.data;
};
