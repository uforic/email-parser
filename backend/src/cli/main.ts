import program from 'commander';
import { generateAuthUrl, getTokens } from '../cmd/generate_auth_url';
import { checkDriveLink } from '../cmd/check_drive_link';
import { listMessages, getMessage } from '../clients/gmail';
import { createContext } from '../context';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseEmail } from '../cmd/parse_message';
import { gmail_v1 } from 'googleapis';
import { homedir } from 'os';

program
    .command('auth')
    .description('get the gmail auth url link')
    .action(() => {
        generateAuthUrl();
    });

program
    .command('token')
    .description('get the gmail token')
    .requiredOption('-c, --code <code>', 'gmail authentication code (from auth command)')
    .action(({ code }) => {
        getTokens(code);
    });

program
    .command('list')
    .description('list messages')
    .option('-t, --token <token_path>', 'path to token.json file', join(homedir(), 'gmail_token.json'))
    .action(async ({ token: tokenPath }) => {
        const gmailCredentials = JSON.parse(readFileSync(tokenPath).toString());
        const context = createContext();
        const { messages } = await listMessages({ ...context, gmailCredentials }, 'matt.sprague@gmail.com');
        console.log('MESSAGES', JSON.stringify(messages));
    });

program
    .command('get')
    .description('get message')
    .option('-t, --token <token_path>', 'path to token.json file', join(homedir(), 'gmail_token.json'))
    .option('-d, --download_path <download_path>', 'where to store the messsage')
    .requiredOption('-m, --messageid <message_id>', 'message id to look up')
    .action(async ({ token: tokenPath, messageid: messageId, download_path: downloadPath }) => {
        const gmailCredentials = JSON.parse(readFileSync(tokenPath).toString());
        const context = createContext();
        const message = await getMessage({ ...context, gmailCredentials }, 'matt.sprague@gmail.com', messageId);
        if (downloadPath) {
            writeFileSync(join(downloadPath, messageId + '.json'), JSON.stringify(message));
        } else {
            console.log('MESSAGES', JSON.stringify(message));
        }
    });

program
    .command('process')
    .description('process message')
    .requiredOption('-m, --message_path <message_path>', 'where is the message body stored')
    .action(async ({ message_path: messagePath }) => {
        const context = createContext();
        const message: gmail_v1.Schema$Message = JSON.parse(readFileSync(messagePath).toString());
        const processResults = parseEmail(context, message);
        console.log('Message parse results', JSON.stringify(processResults));
    });

program
    .command('url-check')
    .description('check a url to see if it is accessible')
    .requiredOption('-u, --url <url>', 'url to check')
    .action(async ({ url }) => {
        const context = createContext();
        const linkStatus = await checkDriveLink(context, url);
        console.log(`Link result for ${url} is ${JSON.stringify(linkStatus)}`);
    });

program.parse(process.argv);
