import { google } from 'googleapis';
import { ServerContext, GmailContext } from '../types';
import jwtDecode from 'jwt-decode';

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

    const initialPayload = await gmailClient.users.messages.list({
        userId: userId,
        pageToken,
        maxResults: 200,
    });

    return initialPayload.data;
};

export const getMessage = async (context: GmailContext & ServerContext, userId: string, messageId: string) => {
    const gmailClient = getGmailClient(context);

    const response = await gmailClient.users.messages.get({
        userId,
        id: messageId,
    });

    return response.data;
};
