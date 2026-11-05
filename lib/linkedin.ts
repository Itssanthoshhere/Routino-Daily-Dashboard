export const LINKEDIN_CALLBACK_PATH = "/api/linkedin/callback";

export function getLinkedInRedirectUri() {
  return process.env.LINKEDIN_REDIRECT_URI;
}

export function hasLinkedInCredentials() {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
      process.env.LINKEDIN_CLIENT_SECRET &&
      getLinkedInRedirectUri()
  );
}
