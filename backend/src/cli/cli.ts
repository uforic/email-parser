import program from 'commander';
import { generateAuthUrl, getTokens } from '../cmd/generate_auth_url';
import { checkDriveLink } from '../cmd/check_drive_link';
import { syncMailbox } from '../cmd/sync_mailbox';
import { client } from '../clients/gmailRateLimited';
import { createServerContext } from '../context';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { analyzeEmail } from '../cmd/parse_message';
import { gmail_v1 } from 'googleapis';
import { homedir } from 'os';

/**
 * Note: I wrote these first, to facilitate exploring the gmail api.
 *
 * However, they are deprecated in favor of running the actualy server.
 */

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
        const context = createServerContext();
        const { messages } = await client.listMessages({ ...context, gmailCredentials }, 'matt.sprague@gmail.com');
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
        const context = createServerContext();
        const message = await client.getMessage({ ...context, gmailCredentials }, 'matt.sprague@gmail.com', messageId);
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
        const context = createServerContext();
        const message: gmail_v1.Schema$Message = JSON.parse(readFileSync(messagePath).toString());
        const processResults = analyzeEmail(context, message);
        console.log('Message parse results', JSON.stringify(processResults));
    });

program
    .command('url-check')
    .description('check a url to see if it is accessible')
    .requiredOption('-u, --url <url>', 'url to check')
    .action(async ({ url }) => {
        const linkStatus = await checkDriveLink(url);
        console.log(`Link result for ${url} is ${JSON.stringify(linkStatus)}`);
    });

program
    .command('sync')
    .description('sync a gmail mailbox')
    .option('-t, --token <token_path>', 'path to token.json file', join(homedir(), 'gmail_token.json'))
    .option('-p, --max_pages <max_pages>', 'max pages to sync, 0 is all pages (50 results per page)', '2')
    .option(
        '-d, --directory_path <directory_path>',
        'where to store the messages we cache',
        join(homedir(), 'message_cache'),
    )
    .action(async ({ directory_path: directoryPath, token: tokenPath, max_pages: maxPages }) => {
        const gmailCredentials = JSON.parse(readFileSync(tokenPath).toString());
        const context = createServerContext();
        const gmailContext = { ...context, gmailCredentials };
        await syncMailbox(gmailContext, directoryPath, {
            maxPages,
        });
    });

program.parse(process.argv);
