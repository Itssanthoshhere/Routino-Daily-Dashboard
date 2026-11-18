import { COLOR_RULES } from "@/lib/calendarColors";
export type ColorRule = { id: string; name: string; colorId: string; keywords: string[]; enabled: boolean; match: "words" | "contains" };
export type ColorSettings = { rules: ColorRule[]; excludedCalendars: string[]; excludedEvents: string[]; excludedEventNames?: Record<string,string> };
export type ColorChange = { key: string; calendarId: string; eventId: string; title: string; start: string; before: string; after: string; etag: string; afterEtag?: string; status: "pending" | "applied" | "failed" | "undone" | "conflict" | "uncertain" };
export type ColorRun = { id: string; createdAt: string; changes: ColorChange[]; status: "applying" | "complete" | "undoing" | "interrupted" };
export type ColorState = { revision: number; settings: ColorSettings; runs: ColorRun[]; pendingRunId?: string; operationStartedAt?: string };
export const EVENT_COLORS = [{ id: "1", name: "Lavender", hex: "#7986cb" },{ id:"2",name:"Sage",hex:"#33b679" },{ id:"3",name:"Grape",hex:"#8e24aa" },{ id:"4",name:"Flamingo",hex:"#e67c73" },{ id:"5",name:"Banana",hex:"#f6bf26" },{ id:"6",name:"Tangerine",hex:"#f4511e" },{ id:"7",name:"Peacock",hex:"#039be5" },{ id:"8",name:"Graphite",hex:"#616161" },{ id:"9",name:"Blueberry",hex:"#3f51b5" },{ id:"10",name:"Basil",hex:"#0b8043" },{ id:"11",name:"Tomato",hex:"#d50000" }];
export const colorName = (id: string) => EVENT_COLORS.find(color => color.id === id)?.name || "Calendar default";
export function defaultColorSettings(): ColorSettings {
  return { rules: [{ id: "entertainment", name: "Entertainment", colorId: "4", keywords: ["movie","movies","series","cinema","netflix","hotstar","prime video","latent","s01","s02","s03","s04","s05","show","super","doraemon","season","episode"], enabled: true, match: "words" }, ...COLOR_RULES.map((rule,index) => ({ ...rule, keywords: [...rule.keywords], id: `default-${index}`, enabled: true, match: "words" as const }))], excludedCalendars: [], excludedEvents: [] };
}
export const emptyColorState = (): ColorState => ({ revision: 0, settings: defaultColorSettings(), runs: [] });
export function validColorSettings(value: unknown): value is ColorSettings {
  if (!value || typeof value !== "object") return false;
  const setting = value as ColorSettings;
  const textList = (list: unknown, count: number) => Array.isArray(list) && list.length <= count && list.every(item => typeof item === "string" && item.length > 0 && item.length <= 1000);
  if (setting.excludedEventNames !== undefined && (!setting.excludedEventNames || typeof setting.excludedEventNames !== "object" || Array.isArray(setting.excludedEventNames) || Object.entries(setting.excludedEventNames).length > 2000 || !Object.entries(setting.excludedEventNames).every(([key,name]) => Array.isArray(setting.excludedEvents) && setting.excludedEvents.includes(key) && typeof name === "string" && name.length > 0 && name.length <= 250))) return false;
  return Array.isArray(setting.rules) && setting.rules.length <= 30 && new Set(setting.rules.map(rule => rule?.id)).size === setting.rules.length && setting.rules.every(rule => rule && typeof rule.id === "string" && rule.id.length > 0 && rule.id.length <= 80 && typeof rule.name === "string" && !!rule.name.trim() && rule.name.length <= 100 && typeof rule.colorId === "string" && /^(?:[1-9]|10|11)$/.test(rule.colorId) && typeof rule.enabled === "boolean" && ["words","contains"].includes(rule.match) && textList(rule.keywords,100) && rule.keywords.length > 0 && rule.keywords.every(word => word.trim().length > 0 && word.length <= 100)) && textList(setting.excludedCalendars,100) && textList(setting.excludedEvents,2000);
}
export function matchColorRule(title: string, settings: ColorSettings): ColorRule | undefined {
  return settings.rules.find(rule => rule.enabled && rule.keywords.some(word => {
    const keyword = word.trim();
    if (!keyword) return false;
    if (rule.match === "contains") return title.toLowerCase().includes(keyword.toLowerCase());
    if (keyword.toLowerCase() === "series" && /\b(time series|fourier series|taylor series|series [abc] funding|series circuit|series analysis)\b/i.test(title)) return false;
    if (keyword.toLowerCase() === "season" && /\bs\d{1,2}(?:\s*e\d{1,3})?\b/i.test(title)) return true;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    return new RegExp(`\\b${escaped}${/^s\d{1,2}$/i.test(keyword) ? "(?:e\\d{1,3})?" : ""}\\b`,"i").test(title);
  }));
}
