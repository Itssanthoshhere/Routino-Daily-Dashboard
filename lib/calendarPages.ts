type Page = { items?: unknown[]; value?: unknown[]; nextPageToken?: string; "@odata.nextLink"?: string };
/** Follow provider pages with cycle/size guards. Never silently report a capped result as complete. */
export async function calendarPages(first: string, fetchPage: (url: string) => Promise<Response>, provider: "google" | "outlook", firstResponse?: Response): Promise<unknown[]> {
  let url: string | null = first;
  const seen = new Set<string>(); const items: unknown[] = [];
  while (url) {
    if (seen.has(url) || seen.size >= 100) throw new Error("Calendar pagination was incomplete. Refresh before relying on availability.");
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== (provider === "google" ? "www.googleapis.com" : "graph.microsoft.com")) throw new Error("Invalid calendar pagination URL.");
    seen.add(url);
    const response: Response = seen.size === 1 && firstResponse ? firstResponse : await fetchPage(url);
    if (!response.ok) throw new Error(`Calendar page failed (HTTP ${response.status}).`);
    const page = await response.json() as Page;
    items.push(...(provider === "google" ? page.items || [] : page.value || []));
    if (provider === "outlook") url = page["@odata.nextLink"] || null;
    else if (page.nextPageToken) { const next = new URL(first); next.searchParams.set("pageToken", page.nextPageToken); url = next.href; }
    else url = null;
  }
  return items;
}
export async function mapCalendarBatches<T,R>(items: T[], callback: (item:T)=>Promise<R>, size = 4): Promise<R[]> {
  const result: R[] = [];
  for (let index = 0; index < items.length; index += size) result.push(...await Promise.all(items.slice(index,index+size).map(callback)));
  return result;
}
