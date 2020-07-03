import { google } from 'googleapis';
import { Context, GmailContext } from '../context';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const getOauth2Client = (context: Context) => {
    const oAuth2Client = new google.auth.OAuth2(
        context.env.gmailClientId,
        context.env.gmailClientSecret,
        context.env.gmailRedirectUrl,
    );
    return oAuth2Client;
};

export const getOauth2Url = (context: Context) => {
    const oauth2Client = getOauth2Client(context);
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    return authUrl;
};

export const getToken = async (context: Context, code: string) => {
    const oauth2Client = getOauth2Client(context);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

const getGmailClient = (context: GmailContext) => {
    const oauth2Client = getOauth2Client(context);
    oauth2Client.setCredentials(context.gmailCredentials);
    const gmailClient = google.gmail({
        auth: oauth2Client,
        version: 'v1',
    });
    return gmailClient;
};

export const listMessages = async (context: GmailContext, userId: string) => {
    const gmailClient = getGmailClient(context);
    const initialPayload = gmailClient.users.messages.list({
        userId: userId,
    });
    const response = await initialPayload;
    const handlePage = (resp: typeof response) => {
        const nextEmails = gmailClient.users.messages.list({
            userId: userId,
            pageToken: resp.data.nextPageToken,
        });
        return {
            messages: resp.data.messages,
            next: async () => handlePage(await nextEmails),
        };
    };
    return handlePage(response);
};

export const getMessage = async (context: GmailContext, userId: string, messageId: string) => {
    const gmailClient = getGmailClient(context);
    const response = await gmailClient.users.messages.get({
        userId,
        id: messageId,
    });
    return response.data;
};
