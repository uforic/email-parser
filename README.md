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

```bash
## get these from the link above
export GMAIL_CLIENT_SECRET=""
export GMAIL_CLIENT_ID=""
export GMAIL_REDIRECT_URL=""
## when running the built distribution, make sure to change
# the server port (default is 4000)
export SERVER_PORT=8080
## Only set this variable when running the built distribution with SERVER_PORT=8080
export FRONTEND_ASSET_PATH="../frontend/build"
## Where do we download messages to disk? default is ~/message_cache
export CACHE_DIRECTORY="~/message_cache"
```

## Developing

-   Versions of node and yarn are managed with asdf. Check [.tool-versions](./.tool-versions) to get the right versions of these tools.

-   Note: I'm using some node12 features

-   I like to use direnv to manage my environment variables, I keep a file called .envrc in this project root, and it sets all the required variables for me.

To develop the frontend, run:

```bash
cd frontend
yarn install
# default port was changed to 8080 in package.json
yarn start
# now, you should be able to access it at http://localhost:8080. API requests are redirected via [setupProxy](./frontend/src/setupProxy.ts) to localhost:4000
```

To develop on the backend, run:

```bash
cd backend
yarn install
## these two prisma commands need to be run once
yarn prisma-generate
yarn prisma-up
# by default, this will serve on port 4000. the frontend's setupProxy.ts will redirect requests here.
yarn ts-node src/cli/server.ts
```

## Building

To build, you need to package the frontend and the backend.

The frontend build produces assets at frontend/build.

```bash
cd frontend/
yarn install
yarn build
```

The backend build produces assets at backed/dist/, and a blank sqlite database file at backend/database/dev.db.

```bash
cd backend/
yarn install
## needed to generate the prisma client to access the db (just needs to be called once)
yarn prisma-generate
## needed to generate the blank sqlite database file (just needs to be called once)
yarn prisma-up
```

## Usage

Run the following command to run the server:

-   Get your environment variables set up, [see above](#environment-variables-guide)

```bash
source your_env_variables.sh
cd backend/
node dist/server.js
```

### Note about building and running

I haven't had a chance to dig into it, but the builds produced in backend/dist don't work when run outside of that folder. It's possible they have a dependency on node_modules. Additionally, the Prisma library is harcoded to look for a database at database/dev.db.

## Assumptions made

-   The code that parses the GMail messages was handcrafted to work on my mailbox, and I made some assumptions about what emails look like, see [collectMatches](./backend/src/helpers/utils.ts#L46). Basically, mixed/related/alternative multipart messages are recursed into, and text/html messages are actually parsed. I know that this will neglect text/plain messages which are often attached to emails as backup, but practically speaking it seems like text/html gets the love in most email clients.

## Capabilities to show off

-   GraphQL type niceness
-   "Progress bar", displaying the progress of the latest sync job
-   Prisma (cool new database ORM)
-   Rudimentary job server

## Known problems

-   Prisma and SQLite caused a couple headaches. SQLite doesn't seem to be happy if you send it two concurrent queries, and Prisma doesn't limit concurrent SQL connections like many other SQL ORM's I'm familiar with. I ended up using a database lock variable, but this slows things down and got me to move towards batch inserts for some operations.

-   I didn't build a bulletproof user session store - I persist the Gmail token and refresh token and associate with the user session, but didn't look into token expiration. I started going down the passport js road, but wanted to focus on other things.

-   There is an issue in the HTML DOM parser I'm using; when you pass in a normal looking URL in an `<a>` or `<img>`, sometimes the href params come out mangled. More on this here: [parse_message](./backend/src/cmd/parse_message.ts#26). The only user facing issue this causes is that some matches don't have a match preview, because we couldn't find the instance of the URL match in the message body.

-   Rate limiting on the Gmail API: I have a meh implementation of a rate limiter for the Gmail API. It looks like we get 250 units per user per second, and a get or list command is 5 units. So 50 operations per second. I perform 10 operations every 200ms per user in the gmail client. A lot not to like about this (jobs held for up to 200ms while they wait, bursty network traffic, etc), but it seems to do the trick.

## I'd like to learn more about

-   What better job server libraries exist out there for node?
-   What is a solid setup for oauth token storage / refreshing? How does it handle different sessions for the same user (ie different browsers)? Offline storage, etc.
-   What is a higher powered database that is easy to package that can handle more load? Or... just postgres?
-   Patterns for rolling windows on API rate limits: I've read [this one](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/), but I'm curious what is done in the "real world", especially when you get distributed.

## FAQs

### Resetting

To blow away all database data and create a new database file, you can run:

```bash
yarn prisma-reset
```

### Getting a new token

If your Gmail authentication token no longer works, you can visit http://localhost:8080 , and re-login. I've noticed this happens after a couple hours of being logged in, and I think more of an investment authentication and refreshing tokens would prevent it.
