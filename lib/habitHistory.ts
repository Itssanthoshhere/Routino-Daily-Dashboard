export function completionStreak(dates: string[], today: string): number {
  const done = new Set(dates);
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!done.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (done.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return streak;
}
