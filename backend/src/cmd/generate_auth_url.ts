import {getOauth2Url, getToken} from "../clients/gmail";
import {createContext} from "../context";

export const generateAuthUrl = () => {
  const context = createContext();
  console.info(
    "Visit this URL to get your Gmail OAuth2 code: " + getOauth2Url(context)
  );
};

export const getTokens = async (code: string) => {
  const context = createContext();
  const tokens = await getToken(context, code);
  console.info("Tokens" + JSON.stringify(tokens));
};
