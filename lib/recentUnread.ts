export const RECENT_GMAIL_QUERY = 'is:unread newer_than:2d -category:promotions -category:social';
type Fetcher = (url: string) => Promise<Pick<Response, 'ok' | 'json'>>;
/** Count matching message IDs; never substitute Gmail's resultSizeEstimate. */
export async function countRecentGmailUnread(fetcher: Fetcher, maxPages = 10): Promise<{ count: number | null; estimate: number | null }> {
  const ids = new Set<string>(), tokens = new Set<string>(); let pageToken = '', estimate: number | null = null;
  try {
    for (let page = 0; page < maxPages; page++) {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.set('q', RECENT_GMAIL_QUERY); url.searchParams.set('maxResults', '500'); url.searchParams.set('fields', 'messages(id),nextPageToken,resultSizeEstimate');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetcher(url.toString()); if (!response.ok) return { count: null, estimate };
      const data = await response.json();
      if (page === 0 && Number.isSafeInteger(data.resultSizeEstimate) && data.resultSizeEstimate >= 0) estimate = data.resultSizeEstimate;
      if (data.messages !== undefined && !Array.isArray(data.messages)) return { count: null, estimate };
      for (const message of data.messages || []) { if (typeof message?.id !== 'string') return { count: null, estimate }; ids.add(message.id); }
      if (!data.nextPageToken) return { count: ids.size, estimate };
      if (typeof data.nextPageToken !== 'string' || tokens.has(data.nextPageToken)) return { count: null, estimate };
      tokens.add(data.nextPageToken); pageToken = data.nextPageToken;
    }
  } catch {}
  return { count: null, estimate };
}
