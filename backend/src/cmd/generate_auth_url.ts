import { getOauth2Url, getToken } from '../clients/gmail';
import { createServerContext } from '../context';

export const generateAuthUrl = () => {
    const context = createServerContext();
    console.info('Visit this URL to get your Gmail OAuth2 code: ' + getOauth2Url(context));
};

export const getTokens = async (code: string) => {
    const context = createServerContext();
    const tokens = await getToken(context, code);
    console.info('Tokens' + JSON.stringify(tokens));
};
