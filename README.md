# Gmail Scraper

An email client that downloads all messages in a Gmail inbox and performs some basic analysis.

## Features

-   Syncs complete Gmail mailbox, savings the messages to a local cache directory.
-   Reasonable guarantees around jobs: most jobs are idempotent, and upon server restart, will be retried.
-   In addition to downloading messages, processes the message for analysis. The two analysis that are done are:
    1.  Unsecured Google Drive and Google Sheets links
    -   visits link, if it's a 200 status OK then it's insecure
    2.  1x1 email trackers
    -   Checks img tags for 1x1 dimensions

## Environment variables guide

You'll need some environment variables set before starting the backend server.

For starters, you'll need some Gmail API tokens (the first 3 variables below). Visit [here](https://developers.google.com/gmail/api/quickstart/nodejs) to generate a token.

```javascript
// gmail related stuff
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
const gmailClientId = process.env.GMAIL_CLIENT_ID;
const gmailRedirectUrl = process.env.GMAIL_REDIRECT_URL;
// where do we store the email messages on disk (not stored in DB)
const cacheDirectory = process.env.CACHE_DIRECTORY || join(homedir(), 'message_cache');
// once the user successfully oauths, and reaches the callback, where do we redirect to
const authSuccessRedirectUrl = process.env.AUTH_SUCCESS_REDIRECT_URL || '/mailbox';
// In development mode, this is 4000. It needs to match the port on GMAIL_REDIRECT_URL
const serverPort = process.env.SERVER_PORT ? Number.parseInt(process.env.SERVER_PORT) : 4000;
// when this is set, the server will serve assets from this path, and not depend on a running webpack devserver
// without this set, you can run webpack dev server in the frontend folder, and using setupProxy
// redirect backend queries only (no asset serving queries) to this backed
const frontendAssetPath = process.env.FRONTEND_ASSET_PATH;
```

## Developing

-   Versions of node and yarn are managed with asdf. Check [.tool-versions](./.tool-versions) to get the right versions of these tools.

-   Note: I'm using some node12 features

-   I like to use direnv to manage my environment variables, I keep a file called .envrc in this project root, and it sets all the required variables for me.

To develop the frontend, run:

```bash
cd frontend
yarn install
# needs to be served at 8080, because in my case the oauth2 redirect url is http://localhost:8080/oauth2callback.
PORT=8080 yarn start
# now, you should be able to access it at http://localhost:8080
```

To develop on the backend, run:

```bash
cd backend
# by default, this will serve on port 4000. the frontend's setupProxy.ts will redirect requests here.
yarn ts-node src/cli/server.ts
```

## Building

To build, you need to package the frontend and the backend.

```bash
cd frontend/
yarn install
yarn build
```

```bash
cd backend/
yarn install
## needed to generate the prisma client to access the db
yarn prisma-generate
## needed to generate the blank sqlite database file
yarn prisma-up
```

## Usage

After building, there should be a build at dist/. Run the following command to run the server:

```bash
# You can get the next 3 Gmail fields from this URL:
export GMAIL_CLIENT_SECRET="";
export GMAIL_CLIENT_ID="";
# this is defined at the time you request your Gmail token
export GMAIL_REDIRECT_URL="http://localhost:8080/oauth2callback";
# not needed, default is ~/message_cache
export CACHE_DIRECTORY="/path/to/folder/on/disk";
# needs to match the port specified on the GMAIL_REDIRECT_URL
export SERVER_PORT="8080";
export FRONTEND_ASSET_PATH="../frontend/build";
cd backend/
node dist/server.js
```

## Assumptions made

-   The code that parses the GMail messages was handcrafted to work on my mailbox, and I made some assumptions about what emails look like: [collectMatches](./backend/src/utils.ts). Basically, mixed/related/alternative multipart messages are recursed into, and text/html messages are actually parsed. I know that this will neglect text/plain messages which are often attached to emails as backup, but practically speaking it seems like text/html gets the love in most email clients.

## Capabilities to show off

-   GraphQL type niceness
-   "Progress bar", displaying the progress of the latest sync job
-   Prisma (cool new database ORM)
-   Rudimentary job server

## Known problems

-   Prisma and SQLite caused a couple headaches. SQLite doesn't seem to be happy if you send it two concurrent queries, and Prisma doesn't limit concurrent SQL connections like many other SQL ORM's I'm familiar with. I ended up using a database lock variable, but this slows things down and got me to move towards batch inserts for some operations.

-   I didn't build a bulletproof user session store - I persist the Gmail token and refresh token and associate with the user session, but didn't look into token expiration. Logins persist between server starts though, FWIW.

-   There is an issue in the HTML DOM parser I'm using; when you pass in a normal looking URL in an `<a>` or `<img>`, some of the GET params get mangled. More on this here: [parse_message](./backend/src/cmd/parse_message.ts#26)

-   Rate limiting on the Gmail API: I have a meh implementation of a rate limiter for the Gmail API. It looks like we get 250 units per user per second, and a get or list command is 5 units. So 50 operations per second. I perform 10 operations every 200ms per user in the gmail client. A lot not to like about this (jobs held for up to 200ms while they wait, bursty network traffic, etc), but it seems to do the trick.

## I'd like to learn more about

-   What better job server libraries exist out there for node?
-   What is a solid setup for oauth token storage / refreshing? How does it handle different sessions for the same user (ie different browsers)?
-   What is a higher powered database that is easy to package that can handle more load? Or... just postgres?
-   Profiling in nodejs - I'm curious as to whether the database lock is the main cause of performance issues. I've used YourKit in the past, I know it's possible to connect to node with Chrome, would be curious to check that out.
-   Patterns for rolling windows on API rate limits: I've read [this one](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/), but I'm curious what is done in the "real world", especially when you get distributed.

## FAQs

### Resetting

To blow away all database data, you can run

```bash
yarn prisma-reset
```

### Getting a new token

If your Gmail authentication token no longer works, you can visit http://localhost:8080 , and re-login.
