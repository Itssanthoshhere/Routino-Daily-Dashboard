import type { TrackerExpenseJournal } from "@/types/trackers";
export type JournalSource = { key: string; year: number; journal: string; summary: string; isFamPay?: boolean };
const decode = (value: string) => value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
/** Read tab labels from the existing link-readable Sheets HTML view; no new OAuth scope. */
export function discoverJournalSources(html: string): JournalSource[] {
  const names: string[] = [];
  for (const match of Array.from(html.matchAll(/<[^>]+id=["']sheet-button-\d+["'][^>]*>([\s\S]*?)<\/li>/gi))) names.push(decode(match[1].replace(/<[^>]*>/g, "")));
  for (const match of Array.from(html.matchAll(/(?:\bname|["']name["'])\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/g))) names.push(decode(match[2].replace(/\\'/g, "'").replace(/\\"/g, '"')));
  const sources = new Map<string, JournalSource>();
  for (const name of names) {
    const match = name.trim().match(/^(20\d{2})\s+(?:(Fam\s*Pay)\s+)?(Expense\s+Journal|Summary)$/i);
    if (!match) continue;
    const year = Number(match[1]), isFamPay = !!match[2], key = `${year}${isFamPay ? "-fampay" : ""}`;
    const source = sources.get(key) || { key, year, isFamPay, journal: `${year}${isFamPay ? " Fam Pay" : ""} Expense Journal`, summary: `${year}${isFamPay ? " Fam Pay" : ""} Summary` };
    if (/Summary/i.test(match[3])) source.summary = name; else source.journal = name;
    sources.set(key, source);
  }
  return Array.from(sources.values()).sort((a, b) => b.year - a.year || Number(a.isFamPay) - Number(b.isFamPay));
}
export function journalYears(journals: Record<string, TrackerExpenseJournal>): number[] {
  return Array.from(new Set(Object.values(journals).filter(j => !j.isPG && /^20\d{2}(?:-fampay)?$/.test(j.key)).map(j => j.year))).sort((a, b) => a - b);
}
export function primaryJournalKey(journals: Record<string, TrackerExpenseJournal>, year = new Date().getFullYear()): string {
  const years = journalYears(journals).filter(y => journals[String(y)]);
  return String(years.includes(year) ? year : years.filter(y => y <= year).at(-1) ?? years.at(-1) ?? year);
}
