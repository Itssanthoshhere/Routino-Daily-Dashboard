import type { Task } from "@/types/dashboard";

const categories = ["work", "personal", "meeting", "urgent", "project", "travel"] as const;
export type TaskDetection = "date" | "time" | "priority" | "category" | `tag:${string}`;
export type ParsedTask = { title: string; dueDate?: string; time?: string; priority?: boolean; category?: Task["category"]; tags: string[]; matches: { start: number; end: number }[] };
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Deliberately small, deterministic grammar. Unknown phrases stay in the title. */
export function parseTaskQuickAdd(text: string, now = new Date(), ignored: TaskDetection[] = []): ParsedTask {
  const result: ParsedTask = { title: text.trim(), tags: [], matches: [] };
  const take = (match: RegExpMatchArray) => result.matches.push({ start: match.index!, end: match.index! + match[0].length });
  for (const match of Array.from(text.matchAll(/(?<!\S)!(high|low|normal)\b/gi))) { if (ignored.includes("priority")) continue; result.priority = match[1].toLowerCase() === "high"; take(match); }
  for (const match of Array.from(text.matchAll(/(?<!\S)#([a-z][\w-]*)\b/gi))) {
    const tag = match[1].toLowerCase();
    if (categories.includes(tag as typeof categories[number])) {
      if (ignored.includes("category")) continue;
      result.category = tag as Task["category"];
    } else if (ignored.includes(`tag:${tag}`)) continue;
    else if (!result.tags.includes(tag)) result.tags.push(tag);
    take(match);
  }
  const dateMatch = text.match(/\b(?:today|tomorrow|in\s+\d{1,3}\s+days?|next\s+week|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{4}-\d{2}-\d{2})\b/i);
  if (dateMatch && !ignored.includes("date")) {
    const phrase = dateMatch[0].toLowerCase();
    const date = new Date(now); date.setHours(0, 0, 0, 0);
    let valid = true;
    if (/^\d{4}/.test(phrase)) {
      const [year, month, day] = phrase.split("-").map(Number);
      date.setFullYear(year, month - 1, day);
      valid = localDate(date) === phrase;
    } else if (phrase === "tomorrow") date.setDate(date.getDate() + 1);
    else if (phrase === "next week") date.setDate(date.getDate() + 7);
    else if (phrase.startsWith("in ")) date.setDate(date.getDate() + Number(phrase.match(/\d+/)![0]));
    else if (phrase !== "today") {
      const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(phrase.replace(/^next\s+/, ""));
      // Weekdays always mean their next occurrence, including seven days from the same weekday.
      date.setDate(date.getDate() + ((weekday - date.getDay() + 7) % 7 || 7));
    }
    if (valid) { result.dueDate = localDate(date); take(dateMatch); }
  }
  const timeMatch = text.match(/\b(?:at\s+)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b|\bat\s+([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (timeMatch && !ignored.includes("time")) {
    let hour = Number(timeMatch[1] ?? timeMatch[4]);
    if (!timeMatch[3] || (hour >= 1 && hour <= 12)) {
      if (timeMatch[3]) hour = hour % 12 + (timeMatch[3].toLowerCase() === "pm" ? 12 : 0);
      result.time = `${String(hour).padStart(2, "0")}:${timeMatch[2] ?? timeMatch[5] ?? "00"}`;
      if (!ignored.includes("date")) result.dueDate ||= localDate(now);
      take(timeMatch);
    }
  }
  result.matches.sort((a, b) => a.start - b.start);
  result.title = result.matches.reduceRight((title, match) => title.slice(0, match.start) + title.slice(match.end), text).replace(/\s+/g, " ").trim();
  return result;
}

export function quickTaskContext(parsed: ParsedTask, category: string, fallback = "Today") {
  return [parsed.dueDate ? `Due ${parsed.dueDate}` : fallback, parsed.time ? `at ${parsed.time}` : "", category, ...parsed.tags.map(tag => `#${tag}`)].filter(Boolean).join(" · ");
}
