export type DailyIntention = {
  quote: string;
  author: string;
  focusHint: string;
};

export const DAILY_INTENTIONS: DailyIntention[] = [
  {
    quote: "Start with what needs your attention.",
    author: "Daily Practice",
    focusHint: "Pick your highest leverage priority first.",
  },
  {
    quote: "Focus is saying no to the hundred other good ideas.",
    author: "Steve Jobs",
    focusHint: "Protect your calendar from non-essentials.",
  },
  {
    quote: "Do less, but do it with complete presence.",
    author: "Marcus Aurelius",
    focusHint: "Singletask through your next 45 minutes.",
  },
  {
    quote: "You do not rise to your goals. You fall to your systems.",
    author: "James Clear",
    focusHint: "Build a gentle, repeatable daily rhythm.",
  },
  {
    quote: "Clarity about what matters provides clarity about what does not.",
    author: "Cal Newport",
    focusHint: "Eliminate shallow distractions early today.",
  },
  {
    quote: "Almost everything will work again if you unplug it for a few minutes.",
    author: "Anne Lamott",
    focusHint: "Take real breathers away from all screens.",
  },
  {
    quote: "Action cures anxiety. Take the smallest next step.",
    author: "Deep Work Principle",
    focusHint: "Break intimidating tasks into 5-minute starts.",
  },
  {
    quote: "A calm mind brings inner strength and quiet confidence.",
    author: "Mindful Rhythm",
    focusHint: "Approach today with calm pacing, not urgency.",
  },
  {
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    focusHint: "Give your prime hours to your life's best work.",
  },
];

export function getTodayIntentionIndex(): number {
  if (typeof window === "undefined") return 0;
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % DAILY_INTENTIONS.length;
}
