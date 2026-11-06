"use client";

import { useMemo } from "react";
import { TrendingUp, Flame, CheckCircle2, Award, Calendar } from "lucide-react";
import type { Habit } from "@/types/dashboard";
import { getLocalDateString } from "./HabitTracker";

type WeeklyInsightsPanelProps = {
  habits: Habit[];
};

export function WeeklyInsightsPanel({ habits }: WeeklyInsightsPanelProps) {
  const stats = useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        overallPercentage: 0,
        dayStats: [],
        totalCheckins: 0,
        topHabit: null,
        bestStreak: 0,
      };
    }

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = getLocalDateString(d);
      const dayName = new Intl.DateTimeFormat("en", { weekday: "short" }).format(d);

      let completedCount = 0;
      habits.forEach((h) => {
        if (h.completedDates.includes(dateStr)) completedCount++;
      });

      const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

      return {
        dateStr,
        dayName,
        completedCount,
        totalHabits: habits.length,
        percentage,
        isToday: i === 6,
      };
    });

    const totalCheckins = days.reduce((acc, d) => acc + d.completedCount, 0);
    const maxPossibleCheckins = habits.length * 7;
    const overallPercentage =
      maxPossibleCheckins > 0 ? Math.round((totalCheckins / maxPossibleCheckins) * 100) : 0;

    // Find habit with highest completions in last 7 days
    let topHabit: Habit | null = null;
    let maxCompletions = -1;
    let bestStreak = 0;

    habits.forEach((h) => {
      const countInLast7 = days.filter((d) => h.completedDates.includes(d.dateStr)).length;
      if (countInLast7 > maxCompletions) {
        maxCompletions = countInLast7;
        topHabit = h;
      }
      if (h.streak > bestStreak) {
        bestStreak = h.streak;
      }
    });

    return {
      overallPercentage,
      dayStats: days,
      totalCheckins,
      topHabit,
      bestStreak,
    };
  }, [habits]);

  if (habits.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-line bg-gradient-to-br from-[#fafbf8] via-white to-[#fbfcf9] p-4 sm:p-5 shadow-2xs animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/10 text-forest">
            <TrendingUp size={15} />
          </span>
          <div>
            <h4 className="text-[12px] font-bold text-ink">7-Day Consistency Insights</h4>
            <p className="text-[10px] text-muted">Weekly habit completion performance</p>
          </div>
        </div>

        {/* Top summary badges */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[14px] font-bold text-forest">{stats.overallPercentage}%</span>
            <span className="block text-[9px] font-medium text-muted">7-Day Score</span>
          </div>
          <div className="h-6 w-px bg-black/10" />
          <div className="text-right">
            <span className="text-[14px] font-bold text-[#c2410c] flex items-center gap-0.5 justify-end">
              <Flame size={13} className="text-[#ea580c]" />
              {stats.bestStreak}d
            </span>
            <span className="block text-[9px] font-medium text-muted">Top Streak</span>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart */}
      <div className="mb-4">
        <div className="flex items-end justify-between gap-2 h-24 pt-2 px-1">
          {stats.dayStats.map((day) => {
            const barHeightPercent = Math.max(day.percentage, 8); // At least 8% so bar is visible
            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[9px] font-bold text-muted group-hover:text-forest transition">
                  {day.completedCount > 0 ? `${day.completedCount}` : "–"}
                </span>
                <div className="w-full max-w-[28px] h-14 bg-[#f0f2ec] rounded-md relative flex items-end overflow-hidden">
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className={`w-full rounded-md transition-all duration-300 ${
                      day.isToday
                        ? "bg-forest shadow-2xs"
                        : day.percentage >= 70
                        ? "bg-[#4ade80]"
                        : day.percentage > 0
                        ? "bg-[#a3e635]"
                        : "bg-transparent"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9.5px] font-medium ${
                    day.isToday ? "font-bold text-forest" : "text-[#758277]"
                  }`}
                >
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick stats footer row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-black/[0.04] pt-3 text-[11px]">
        <div className="rounded-lg bg-white border border-line p-2.5 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-forest shrink-0" />
          <div className="min-w-0">
            <span className="block font-bold text-ink">{stats.totalCheckins} check-ins</span>
            <span className="block text-[9px] text-muted">Logged this week</span>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-line p-2.5 flex items-center gap-2">
          <Award size={14} className="text-[#ea580c] shrink-0" />
          <div className="min-w-0 truncate">
            <span className="block font-bold text-ink truncate">
              {stats.topHabit ? (stats.topHabit as Habit).name : "Keep going"}
            </span>
            <span className="block text-[9px] text-muted">Most consistent</span>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-line p-2.5 flex items-center gap-2">
          <Calendar size={14} className="text-[#6088d1] shrink-0" />
          <div className="min-w-0">
            <span className="block font-bold text-ink">
              {stats.overallPercentage >= 80 ? "Super Momentum" : "Steady Rhythm"}
            </span>
            <span className="block text-[9px] text-muted">Consistent compounding</span>
          </div>
        </div>
      </div>
    </div>
  );
}
