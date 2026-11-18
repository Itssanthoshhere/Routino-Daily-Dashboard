export function calendarJumpPosition(value: string, today: Date): { weekOffset: number; dayIndex: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(today.getTime())) return null;
  const target = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(target.getTime()) || target.toISOString().slice(0,10) !== value) return null;
  // Compare calendar days in UTC so DST cannot shift a date into the wrong strip.
  const base = new Date(0);
  base.setUTCFullYear(today.getFullYear(), today.getMonth(), today.getDate());
  base.setUTCHours(0,0,0,0);
  const days = Math.round((target.getTime() - base.getTime()) / 86400000);
  const weekOffset = Math.floor(days / 7);
  return { weekOffset, dayIndex: days - weekOffset * 7 };
}
