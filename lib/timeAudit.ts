import { DashboardEvent, TimeAuditCategory, AuditedEvent } from "@/types/dashboard";

export const DEFAULT_TIME_AUDIT_CATEGORIES: TimeAuditCategory[] = [
  {
    id: "sleep",
    name: "Sleep",
    color: "#534AB7",
    keys: ["sleep", "slee", "sle"],
  },
  {
    id: "typing",
    name: "Typing / Journaling",
    color: "#9B59B6",
    keys: ["typing", "journal", "notes"],
  },
  {
    id: "social",
    name: "Social Media",
    color: "#D85A30",
    keys: [
      "instaa",
      "instagram",
      "youtube",
      "candy crush",
      "coc",
      "bgmi",
      "gaming",
      "chit chat",
      "bakchodi",
      "roaming",
      "timepass",
      "time pass",
    ],
  },
  {
    id: "study_work",
    name: "Study / Work",
    color: "#1D9E75",
    keys: [
      "cset",
      "assignment",
      "project",
      "course",
      "coursera",
      "codechef",
      "leetcode",
      "web dev",
      "wavechat",
      "nlp",
      "soft computing",
      "career skills",
      "ieee",
      "dcc",
      "placement",
      "fastapi",
      "roomify",
      "mf360",
      "codigo",
      "latest",
      "nptel",
      "hackathon",
      "contest",
      "linkedin",
      "certificate",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#378ADD",
    keys: ["movie", "series", "cinema", "watch", "netflix", "hotstar"],
  },
  {
    id: "routine",
    name: "Daily Routine",
    color: "#BA7517",
    keys: [
      "bath",
      "lunch",
      "dinner",
      "freshup",
      "fresh up",
      "maggi",
      "food",
      "laundry",
      "sorting",
      "vc w",
      "call w",
      "breakfast",
      "snack",
      "chai",
      "coffee",
      "cooking",
      "utensil",
      "face wash",
      "acne",
      "ance cream",
      "oil",
      "trim",
      "haircut",
      "head bath",
    ],
  },
  {
    id: "travel",
    name: "Travel / Outings",
    color: "#888780",
    keys: [
      "manali",
      "train",
      "travel",
      "trip",
      "ndls",
      "mas",
      "bus",
      "outing",
      "roaming around",
      "cab",
      "metro",
      "airport",
      "station",
      "central",
      "gate",
    ],
  },
  {
    id: "other",
    name: "Other",
    color: "#D4537E",
    keys: [],
  },
];

export const TIME_AUDIT_STORAGE_KEY = "routino_time_audit_categories_v1";

export function loadSavedCategories(): TimeAuditCategory[] {
  if (typeof window === "undefined") return DEFAULT_TIME_AUDIT_CATEGORIES;
  try {
    const raw = localStorage.getItem(TIME_AUDIT_STORAGE_KEY);
    if (!raw) return DEFAULT_TIME_AUDIT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return DEFAULT_TIME_AUDIT_CATEGORIES;
}

export function saveCategories(categories: TimeAuditCategory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TIME_AUDIT_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // ignore
  }
}

export function categorizeEventTitle(
  title: string,
  categories: TimeAuditCategory[]
): TimeAuditCategory {
  const t = (title || "").toLowerCase();
  for (const cat of categories) {
    if (cat.id === "other" || cat.name === "Other") continue;
    if (cat.keys.some((k) => k && t.includes(k.toLowerCase()))) {
      return cat;
    }
  }
  const otherCat = categories.find(
    (c) => c.id === "other" || c.name.toLowerCase() === "other"
  );
  return (
    otherCat ||
    categories[categories.length - 1] || {
      id: "other",
      name: "Other",
      color: "#D4537E",
      keys: [],
    }
  );
}

export function processEventForAudit(
  event: DashboardEvent,
  categories: TimeAuditCategory[]
): AuditedEvent | null {
  const startRaw = event.start?.dateTime ?? event.start?.date;
  const endRaw = event.end?.dateTime ?? event.end?.date;
  if (!startRaw || !endRaw) return null;

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  const isAllDay = !event.start?.dateTime && Boolean(event.start?.date);
  const diffMs = endDate.getTime() - startDate.getTime();
  let durationMinutes = Math.round(diffMs / (1000 * 60));

  if (durationMinutes <= 0) return null;
  // All day event capping at 24 hours (1440 mins)
  if (isAllDay && durationMinutes > 1440) {
    durationMinutes = 1440;
  }

  const title = event.summary?.trim() || "Untitled Event";
  const category = categorizeEventTitle(title, categories);

  return {
    id: event.id,
    title,
    start: startDate,
    end: endDate,
    durationMinutes,
    category,
    calendarName: event.calendarSummary || "Google Calendar",
    isAllDay,
  };
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHoursDecimal(minutes: number): string {
  return (Math.round((minutes / 60) * 10) / 10).toFixed(1) + "h";
}

export function generateAuditCSV(events: AuditedEvent[]): string {
  const headers = [
    "Title",
    "Date",
    "Start Time",
    "End Time",
    "Duration (Mins)",
    "Duration (Hours)",
    "Category",
    "Calendar",
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = events.map((ev) => {
    const dateStr = ev.start.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const startTimeStr = ev.isAllDay
      ? "All Day"
      : ev.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endTimeStr = ev.isAllDay
      ? "All Day"
      : ev.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return [
      escapeCell(ev.title),
      escapeCell(dateStr),
      escapeCell(startTimeStr),
      escapeCell(endTimeStr),
      escapeCell(ev.durationMinutes),
      escapeCell(formatMinutes(ev.durationMinutes)),
      escapeCell(ev.category.name),
      escapeCell(ev.calendarName || "Calendar"),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export const CLEAN_GOOGLE_APPS_SCRIPT = `/**
 * Google Apps Script for Calendar → Google Sheets Sync & Time Audit
 *
 * Setup Instructions:
 * 1. Open Google Sheets (create a blank spreadsheet)
 * 2. Click "Extensions" → "Apps Script"
 * 3. Replace all code in Code.gs with this script
 * 4. Click "Save" and then click "Run" -> runAll
 * 5. Authorize permissions when prompted
 * 6. (Optional) Set up an automated daily trigger via Triggers (Alarm Icon)
 */

const CONFIG = {
  SHEET_NAME: "Calendar Events",
  TIME_RANGE_DAYS: 90, // Past 90 days (fast & stays within Apps Script 6-min limit)
  MAX_EVENTS: 5000,
  TIMEZONE: "GMT+5:30", // Change if needed (e.g. Session.getScriptTimeZone())
};

const CATEGORY_CONFIG = {
  "Sleep": {
    color: "#534AB7",
    keys: ["sleep", "slee", "sle"]
  },
  "Typing / Journaling": {
    color: "#9B59B6",
    keys: ["typing", "journal", "notes"]
  },
  "Social Media": {
    color: "#D85A30",
    keys: ["instaa", "instagram", "youtube", "candy crush", "coc", "bgmi", "gaming", "chit chat", "bakchodi", "roaming", "timepass", "time pass"]
  },
  "Study / Work": {
    color: "#1D9E75",
    keys: ["cset", "assignment", "project", "course", "coursera", "codechef", "leetcode", "web dev", "wavechat", "nlp", "soft computing", "career skills", "ieee", "dcc", "placement", "fastapi", "roomify", "mf360", "codigo", "latest", "nptel", "hackathon", "contest", "linkedin", "certificate"]
  },
  "Entertainment": {
    color: "#378ADD",
    keys: ["movie", "series", "cinema", "watch", "netflix", "hotstar"]
  },
  "Daily Routine": {
    color: "#BA7517",
    keys: ["bath", "lunch", "dinner", "freshup", "fresh up", "maggi", "food", "laundry", "sorting", "vc w", "call w", "breakfast", "snack", "chai", "coffee", "cooking", "utensil", "face wash", "acne", "ance cream", "oil", "trim", "haircut", "head bath"]
  },
  "Travel / Outings": {
    color: "#888780",
    keys: ["manali", "train", "travel", "trip", "ndls", "mas", "bus", "outing", "roaming around", "cab", "metro", "airport", "station", "central", "gate"]
  },
  "Other": {
    color: "#D4537E",
    keys: []
  }
};

function runAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let dataSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!dataSheet) dataSheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - CONFIG.TIME_RANGE_DAYS);

  const allCalendars = CalendarApp.getAllCalendars();
  const rows = [["Title", "Date", "Start", "End", "Minutes", "Hours", "Category", "Calendar"]];

  const tz = CONFIG.TIMEZONE || Session.getScriptTimeZone();

  for (let cal of allCalendars) {
    const events = cal.getEvents(past, now, { max: CONFIG.MAX_EVENTS });
    events.forEach(e => {
      if (!e.isAllDayEvent()) {
        const start = e.getStartTime();
        const end = e.getEndTime();
        const diff = Math.round((end - start) / (1000 * 60));
        if (diff <= 0) return;

        const title = e.getTitle() || "Untitled";
        const cat = matchCategory(title);

        rows.push([
          title,
          Utilities.formatDate(start, tz, "yyyy-MM-dd"),
          Utilities.formatDate(start, tz, "hh:mm a"),
          Utilities.formatDate(end, tz, "hh:mm a"),
          diff,
          Math.floor(diff / 60) + "h " + (diff % 60) + "m",
          cat,
          cal.getName()
        ]);
      }
    });
  }

  dataSheet.clear();
  dataSheet.getRange(1, 1, rows.length, rows[0].length).setNumberFormat('@STRING@');
  dataSheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  SpreadsheetApp.flush();

  // Summary & Categories
  const stats = {};
  const categories = {};
  Object.keys(CATEGORY_CONFIG).forEach(cat => categories[cat] = 0);
  let totalMins = 0;

  for (let i = 1; i < rows.length; i++) {
    const title = rows[i][0];
    const mins = Number(rows[i][4]);
    const cat = rows[i][6];

    stats[title] = (stats[title] || 0) + mins;
    categories[cat] = (categories[cat] || 0) + mins;
    totalMins += mins;
  }

  // Summary Sheet
  const summaryData = [["Activity", "Total Time", "%"]];
  Object.keys(stats).sort((a, b) => stats[b] - stats[a]).forEach(key => {
    const p = totalMins > 0 ? ((stats[key] / totalMins) * 100).toFixed(1) + "%" : "0%";
    const h = Math.floor(stats[key] / 60);
    const m = stats[key] % 60;
    summaryData.push([key, h + "h " + m + "m", p]);
  });

  let summarySheet = ss.getSheetByName("📊 Summary");
  if (!summarySheet) summarySheet = ss.insertSheet("📊 Summary");
  summarySheet.clear();
  summarySheet.getRange(1, 1, summaryData.length, 3).setValues(summaryData);

  // Dashboard Sheet & Charts
  buildDashboard(ss, stats, categories, totalMins);

  SpreadsheetApp.getUi().alert("✅ Synced " + (rows.length - 1) + " events across " + allCalendars.length + " calendars.");
}

function matchCategory(title) {
  const t = (title || "").toLowerCase();
  for (const [cat, cfg] of Object.entries(CATEGORY_CONFIG)) {
    if (cat === "Other") continue;
    if (cfg.keys.some(k => t.includes(k))) return cat;
  }
  return "Other";
}

function buildDashboard(ss, stats, categories, totalMins) {
  let chartData = ss.getSheetByName("_chart_data");
  if (!chartData) chartData = ss.insertSheet("_chart_data");
  chartData.clear();
  chartData.hideSheet();

  // Top 15 activities data
  chartData.getRange(1, 1, 1, 2).setValues([["Activity", "Hours"]]);
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 15);
  sorted.forEach(([title, mins], i) => {
    chartData.getRange(i + 2, 1, 1, 2).setValues([[title, Math.round((mins / 60) * 10) / 10]]);
  });

  // Category data
  chartData.getRange(18, 1, 1, 2).setValues([["Category", "Hours"]]);
  Object.entries(categories).forEach(([cat, mins], i) => {
    chartData.getRange(19 + i, 1, 1, 2).setValues([[cat, Math.round(mins / 60)]]);
  });

  // Dashboard UI sheet
  let dash = ss.getSheetByName("📈 Dashboard");
  if (!dash) dash = ss.insertSheet("📈 Dashboard");
  dash.clear();
  dash.getCharts().forEach(c => dash.removeChart(c));

  // Top 15 Bar Chart
  const barChart = dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(chartData.getRange(1, 1, sorted.length + 1, 2))
    .setPosition(1, 1, 0, 0)
    .setOption("title", "Top 15 Activities by Hours")
    .setOption("hAxis.title", "Hours")
    .setOption("legend", { position: "none" })
    .setOption("width", 620)
    .setOption("height", 460)
    .setOption("colors", ["#534AB7"])
    .build();
  dash.insertChart(barChart);

  // Category Pie/Donut Chart
  const pieColors = Object.values(CATEGORY_CONFIG).map(c => c.color);
  const pieChart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(chartData.getRange(18, 1, Object.keys(categories).length + 1, 2))
    .setPosition(1, 10, 0, 0)
    .setOption("title", "Time by Category")
    .setOption("pieHole", 0.4)
    .setOption("width", 460)
    .setOption("height", 460)
    .setOption("colors", pieColors)
    .build();
  dash.insertChart(pieChart);

  // Category Summary Table
  dash.getRange(1, 17, 1, 3).setValues([["Category", "Hours", "%"]]);
  dash.getRange(1, 17, 1, 3).setFontWeight("bold");
  dash.getRange(1, 17, 1, 3).setBackground("#222222");
  dash.getRange(1, 17, 1, 3).setFontColor("#ffffff");
  dash.getRange(1, 17, 1, 3).setHorizontalAlignment("center");

  Object.entries(categories).forEach(([cat, mins], i) => {
    const hrs = Math.round(mins / 60);
    const pct = totalMins > 0 ? ((mins / totalMins) * 100).toFixed(1) + "%" : "0%";
    const row = i + 2;
    const color = CATEGORY_CONFIG[cat].color;

    dash.getRange(row, 17, 1, 3).setValues([[cat, hrs + "h", pct]]);
    dash.getRange(row, 17).setBackground(color);
    dash.getRange(row, 17).setFontColor("#ffffff");
    dash.getRange(row, 17).setFontWeight("bold");
    dash.getRange(row, 18, 1, 2).setHorizontalAlignment("center");
    dash.getRange(row, 18, 1, 2).setBackground("#f8f8f8");
  });

  dash.setColumnWidth(17, 180);
  dash.setColumnWidth(18, 80);
  dash.setColumnWidth(19, 70);

  // Keywords Table
  const keyTableStartRow = Object.keys(categories).length + 4;
  dash.getRange(keyTableStartRow, 17, 1, 2).setValues([["Category", "Keywords"]]);
  dash.getRange(keyTableStartRow, 17, 1, 2).setFontWeight("bold");
  dash.getRange(keyTableStartRow, 17, 1, 2).setBackground("#222222");
  dash.getRange(keyTableStartRow, 17, 1, 2).setFontColor("#ffffff");

  Object.entries(CATEGORY_CONFIG).forEach(([cat, cfg], i) => {
    const row = keyTableStartRow + i + 1;
    const keywordStr = cfg.keys.length > 0 ? cfg.keys.join(", ") : "everything else";

    dash.getRange(row, 17, 1, 2).setValues([[cat, keywordStr]]);
    dash.getRange(row, 17).setBackground(cfg.color);
    dash.getRange(row, 17).setFontColor("#ffffff");
    dash.getRange(row, 17).setFontWeight("bold");
    dash.getRange(row, 18).setWrap(true);
    dash.getRange(row, 18).setBackground("#f8f8f8");
    dash.setRowHeight(row, 44);
  });

  dash.setColumnWidth(18, 420);
  dash.activate();
}
`;
