# Gmail Scraper

An email client that downloads all messages in a GMail inbox and performs some basic analysis.

## Features

-   Syncs complete Gmail mailbox, savings the messages to a local cache directory.
-   In addition to downloading messages, processes the message for analysis. The two analysis that are done are:
    1.  Unsecured Google Drive and Google Sheets links
    -   visits link, if it's a 200 status OK then it's insecure)
    2.  1x1 email trackers
    -   Checks img tags for 1x1 dimensions

## Capabilities to show off

-   GraphQL
-   "Progress bar", displaying the progress of the latest sync job
-   Prisma (cool new database ORM)
-   Rudimentary job server

## I'd like to learn more about

-   What better job servers exist out there for node?
-   What is a solid setup for oauth token storage / refreshing? How does it handle different sessions for the same user (ie different browsers)
-   What is a higher powered database that is easy to package that can handle more load? Or... just postgres?
-   Profiling in nodejs - I'm curious as to whether the database lock is the main cause of performance issues. I've used YourKit in the past, I know it's possible to connect to node with Chrome, would be curious to check that out.

## Assumptions made

-   The code that parses the GMail messages was handcrafted to work on my mailbox, and I made some assumptions about what emails look like: [collectMatches](./backend/src/utils.ts). Basically, mixed/related/alternative multipart messages are recursed into, and text/html messages are actually parsed. I know that this will neglect text/plain messages which are often attached to emails as backup, but practically speaking it seems like text/html gets the love in most email clients.

## Known problems

-   Prisma and SQLite caused a couple headaches. SQLite doesn't seem to be happy if you send it two concurrent queries, and Prisma doesn't limit concurrent SQL connections like many other SQL ORM's I'm familiar with. I ended up using a database lock variable, but this slows things down.

-   I didn't build a bulletproof user session store - I persist the Gmail token and refresh token and associate with the user session, but didn't look into token expiration. Logins persist between server starts though, FWIW.

-   There is an issue in the HTML DOM parser I'm using; when you pass in a normal looking URL in an `<a>` or `<img>`, some of the GET params get mangled. More on this here: [parse_message](./backend/src/cmd/parse_message.ts#26)

-   Between server restarts, the job counts reset - this sometimes results in negative counts (queued - completed - failed goes negative). I stored job counts in memory instead of querying for them each time, because I was trying to minimize SQLite reads.

## .envrc file

You'll need some environment variables set before starting the backend server and frontend service. You can either use direnv to automatically load these when you change into the right directory, or you can source this file before executing the relevant node service.

```bash
## backend
## you'll need gmail client secrets and ids configured to redirect you to localhost:8080/oauth2callback
export GMAIL_CLIENT_SECRET=""
export GMAIL_CLIENT_ID=""
export GMAIL_REDIRECT_URL="http://localhost:8080/oauth2callback"
## frontend
export PORT=8080
```

## Dependencies

-   Environment variables in bash are managed by direnv. If you'd rather not install it, you can run this before running other commands:

```bash
source .envrc
```

-   Versions of node and yarn are managed with asdf. If you'd like to install them manually, there are some node12 features I'm using. Check .tool-versions to get the right versions of these tools.

## Usage

In one terminal, run this:

```js
cd frontend
yarn start
```

In another terminal, run this:

```js
cd backend
yarn prisma-reset
yarn ts-node src/cli/server.ts
```

## Usage
