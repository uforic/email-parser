# Gmail Scraper

An email client that downloads all messages in a GMail inbox

## Features

-   Syncs complete Gmail mailbox, savings the messages to a local cache directory.
-   In addition to downloading messages, processes the message for analysis. The two analysis that are done are:
    1.  Unsecured Google Drive and Google Sheets links
    2.  1x1 email trackers

## Capabilities to show off

-   GraphQL
-   "Progress bar", displaying the progress of the latest sync job
-   Prisma (cool new database ORM)
-   Rudimentary job server

## Assumptions made

-   The code that parses the GMail messages was handcrafted to work on my mailbox, and I made some assumptions about what emails look like: [parse_message](./backend/src/cmd/parse_message.ts). Basically, mixed/related/alternative multipart messages are recursed into, and text/html messages are actually parsed. I know that this will neglect text/plain messages which are often attached to emails as backup, but practically speaking it seems like text/html gets the love in most email clients.

## Known problems

-   Prisma and SQLite were problematic. SQLite doesn't seem to be happy if you send it two concurrent queries, and Prisma doesn't limit concurrent SQL connections like many other SQL ORM's I'm familiar with. I ended up using a database lock variable, but this slows things down.

-   I didn't mess with express sessions, to persist logins in between server restarts. I know that to do it, I'd need to plug in a "store" variable into the library, and save to my SQLite database. I'd also need to store the refresh token, and keep track of expired tokens / refresh them. As a workaround, the program will complain, and redirect you to the login page.

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
yarn ts-node src/cli/server.ts
```

## Usage
