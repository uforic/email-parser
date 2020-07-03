import * as express from "express";
import * as path from "path";
import {readFileSync} from "fs";
import {google} from "googleapis";
// const {google} = require("googleapis");
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

var app = express();
type Credentials = {
  installed: {
    client_secret: string;
    client_id: string;
    redirect_uris: Array<string>;
  };
};
const credentials: Credentials = JSON.parse(
  readFileSync("credentials.json").toString()
);

const getOauth2Client = (credentials: Credentials) => {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  return oAuth2Client;
};

const oauth2Client = getOauth2Client(credentials);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  return authUrl;
}

app.get("/gmail/auth", (_, res) => {
  const url = authorize();
  res.redirect(url);
});

app.get("/oauth2callback", (req, res, next) => {
  const code = req.query.code as string;
  console.error("GOT CODE", code, req.params);
  // This will provide an object with the access_token and refresh_token.
  // Save these somewhere safe so they can be used at a later time.
  oauth2Client
    .getToken(code)
    .then((a: {tokens: any}) => {
      console.error("GOT TOKDENS", a);
      oauth2Client.setCredentials(a.tokens);
      const gmail = google.gmail({
        auth: oauth2Client,
        version: "v1",
      });
      console.error("LISTING MESSAGES");
      listMessages(gmail, "matt.sprague@gmail.com", "", async (messages) => {
        res.send(
          "Code is " +
            code +
            ", scope is" +
            req.param("scope") +
            ", messages are" +
            JSON.stringify(messages)
        );
      });
    })
    .catch((err) => {
      console.error(err);
      next();
    });
});

// Simple endpoint that returns the current time
app.get("/api/time", function (req, res) {
  res.send(new Date().toISOString());
});

// Serve static files
app.use("/", express.static(path.join(__dirname, "/www")));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
function listMessages(
  client: any,
  userId: string,
  query: string,
  callback: (a: any) => void
) {
  const stuff = client.users.messages.list({
    userId: userId,
    q: query,
  });

  console.log("HERE", stuff);
  return stuff.then((resp: any) => {
    callback(resp.data.messages);
  });
}
