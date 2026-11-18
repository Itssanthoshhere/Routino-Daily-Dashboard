export function isEntertainmentEvent(title: string): boolean {
  if (/\b(movies?|cinema|netflix|hotstar|prime video|show|super|latent|doraemon|tv show|tv series|web series|episodes?|seasons?|binge(?: watching)?|s\d{1,2}(?:\s*e\d{1,3})?)\b/i.test(title)) return true;
  return /\bseries\b/i.test(title) && !/\b(time series|fourier series|taylor series|series [abc] funding|series circuit|series analysis)\b/i.test(title);
}

export const COLOR_RULES = [
  {
    name: "Meals",
    colorId: "2", // Sage / Pale Green
    keywords: [
      "breakfast",
      "lunch",
      "dinner",
      "maggi",
      "yippee",
      "biryani",
      "soup",
      "snacks",
      "snack",
      "cooking",
      "food",
    ],
  },
  {
    name: "Routine & Social",
    colorId: "9", // Blueberry / Blue
    keywords: [
      "sleep",
      "instaa",
      "insta",
      "bath",
      "freshup",
      "fresh up",
      "youtube",
      "chit",
      "chit chat",
    ],
  },
  {
    name: "Games / Gaming",
    colorId: "11", // Tomato / Red
    keywords: [
      "subway",
      "coc",
      "clash of clans",
      "bgmi",
      "pubg",
      "games",
      "game",
      "gaming",
      "candy crush",
      "chess",
      "valorant",
      "fifa",
      "gta",
      "minecraft",
      "free fire",
      "cod",
    ],
  },
  {
    name: "Typing & Notes",
    colorId: "8", // Graphite / Gray
    keywords: ["typing", "journal", "notes"],
  },
  {
    name: "Work & Tasks",
    colorId: "5", // Banana / Yellow
    keywords: [
      "mf360",
      "building",
      "work",
      "project",
      "sprint",
      "planning",
      "tasks",
      "routino",
      "cset",
      "cs400",
      "fund disclosure",
      "deep work",
      "engineering",
      "design review",
    ],
  },
];

export function calendarColorRule(title: string): { name: string; colorId: string } | undefined {
  if (isEntertainmentEvent(title)) return { name: "Entertainment", colorId: "4" };
  return COLOR_RULES.find(rule => rule.keywords.some(keyword => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(title);
  }));
}
