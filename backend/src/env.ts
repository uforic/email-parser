export type EnvVars = {
  gmailClientSecret: string;
  gmailClientId: string;
  gmailRedirectUrl: string;
};

export const getEnvVars = () => {
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailRedirectUrl = process.env.GMAIL_REDIRECT_URL;
  return {
    gmailClientSecret,
    gmailClientId,
    gmailRedirectUrl,
  } as EnvVars;
};
