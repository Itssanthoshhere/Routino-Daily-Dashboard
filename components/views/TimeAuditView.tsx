"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Settings2,
  Code2,
  Copy,
  Check,
  Search,
  Filter,
  X,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Moon,
  Briefcase,
  Smartphone,
  Coffee,
  Tv,
  Compass,
  FileText,
  HelpCircle,
} from "lucide-react";
import { DashboardEvent, TimeAuditCategory, AuditedEvent } from "@/types/dashboard";
import {
  DEFAULT_TIME_AUDIT_CATEGORIES,
  loadSavedCategories,
  saveCategories,
  processEventForAudit,
  formatMinutes,
  formatHoursDecimal,
  generateAuditCSV,
  CLEAN_GOOGLE_APPS_SCRIPT,
} from "@/lib/timeAudit";

type TimeAuditViewProps = {
  events: DashboardEvent[];
  isConnected: boolean;
};

type DateFilterPreset =
  | "today"
  | "yesterday"
  | "7days"
  | "14days"
  | "30days"
  | "thisMonth"
  | "all";

export function TimeAuditView({ events, isConnected }: TimeAuditViewProps) {
  // Category Rules state
  const [categories, setCategories] = useState<TimeAuditCategory[]>(
    DEFAULT_TIME_AUDIT_CATEGORIES
  );
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);

  // Filters state
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("7days");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Category editing state in modal
  const [editingCategories, setEditingCategories] = useState<TimeAuditCategory[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState<{ [catId: string]: string }>({});

  // Load saved categories on mount
  useEffect(() => {
    const saved = loadSavedCategories();
    setCategories(saved);
    setEditingCategories(saved);
    setIsCategoriesLoaded(true);
  }, []);

  // Save categories when updated
  const handleSaveCategories = (newCats: TimeAuditCategory[]) => {
    setCategories(newCats);
    setEditingCategories(newCats);
    saveCategories(newCats);
    setShowConfigModal(false);
  };

  const handleResetCategories = () => {
    if (window.confirm("Reset all categories and keywords to initial defaults?")) {
      handleSaveCategories(DEFAULT_TIME_AUDIT_CATEGORIES);
    }
  };

  // Date Range Bounds computation
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (datePreset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "7days":
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case "14days":
        start.setDate(now.getDate() - 13);
        start.setHours(0, 0, 0, 0);
        break;
      case "30days":
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case "all":
        start.setFullYear(2000, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(2099, 11, 31);
        break;
    }

    return { start, end };
  }, [datePreset]);

  // Process & filter all events
  const auditedEvents = useMemo(() => {
    const processed: AuditedEvent[] = [];

    for (const ev of events) {
      const audited = processEventForAudit(ev, categories);
      if (!audited) continue;

      // Filter by date range
      if (
        audited.start >= dateRangeBounds.start &&
        audited.start <= dateRangeBounds.end
      ) {
        processed.push(audited);
      }
    }

    // Sort by start date desc
    return processed.sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [events, categories, dateRangeBounds]);

  // Category stats aggregation
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { category: TimeAuditCategory; minutes: number; count: number }
    > = {};

    categories.forEach((cat) => {
      map[cat.id] = { category: cat, minutes: 0, count: 0 };
    });

    let totalMinutes = 0;

    auditedEvents.forEach((ev) => {
      const catId = ev.category.id;
      if (!map[catId]) {
        map[catId] = { category: ev.category, minutes: 0, count: 0 };
      }
      map[catId].minutes += ev.durationMinutes;
      map[catId].count += 1;
      totalMinutes += ev.durationMinutes;
    });

    const list = Object.values(map)
      .map((item) => ({
        ...item,
        percentage:
          totalMinutes > 0 ? (item.minutes / totalMinutes) * 100 : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return {
      list,
      totalMinutes,
      totalEvents: auditedEvents.length,
    };
  }, [auditedEvents, categories]);

  // Top 15 Activities aggregation
  const topActivities = useMemo(() => {
    const activityMap: Record<
      string,
      { title: string; minutes: number; count: number; category: TimeAuditCategory }
    > = {};

    auditedEvents.forEach((ev) => {
      const key = ev.title.trim();
      if (!activityMap[key]) {
        activityMap[key] = {
          title: key,
          minutes: 0,
          count: 0,
          category: ev.category,
        };
      }
      activityMap[key].minutes += ev.durationMinutes;
      activityMap[key].count += 1;
    });

    const totalMins = categoryStats.totalMinutes;
    return Object.values(activityMap)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 15)
      .map((act) => ({
        ...act,
        percentage: totalMins > 0 ? (act.minutes / totalMins) * 100 : 0,
      }));
  }, [auditedEvents, categoryStats.totalMinutes]);

  // Filtered events for the event log
  const displayedEvents = useMemo(() => {
    return auditedEvents.filter((ev) => {
      const matchesCategory =
        selectedCategoryFilter === "ALL" ||
        ev.category.id === selectedCategoryFilter;
      const matchesSearch =
        !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [auditedEvents, selectedCategoryFilter, searchQuery]);

  // CSV Export handler
  const handleExportCsv = () => {
    const csvContent = generateAuditCSV(auditedEvents);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `routino-time-audit-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy script handler
  const handleCopyScript = () => {
    navigator.clipboard.writeText(CLEAN_GOOGLE_APPS_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Helper icon for categories
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "sleep":
        return <Moon size={14} />;
      case "study_work":
        return <Briefcase size={14} />;
      case "social":
        return <Smartphone size={14} />;
      case "routine":
        return <Coffee size={14} />;
      case "entertainment":
        return <Tv size={14} />;
      case "travel":
        return <Compass size={14} />;
      case "typing":
        return <FileText size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  // Days in range for daily average
  const daysInRange = useMemo(() => {
    switch (datePreset) {
      case "today":
      case "yesterday":
        return 1;
      case "7days":
        return 7;
      case "14days":
        return 14;
      case "30days":
        return 30;
      case "thisMonth":
        return new Date().getDate();
      default:
        return 30;
    }
  }, [datePreset]);

  const dailyAverageMinutes = Math.round(categoryStats.totalMinutes / daysInRange);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest/10 text-forest">
              <PieChartIcon size={18} />
            </span>
            <div>
              <h1 className="text-[19px] sm:text-[21px] font-bold text-ink">
                Time Audit & Analytics
              </h1>
              <p className="text-[11px] text-muted">
                Life-logging & automated activity categorization from your calendar
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Apps Script Dialog */}
          <button
            type="button"
            onClick={() => setShowScriptModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-2xs hover:bg-[#f8f9f5] transition cursor-pointer"
            title="View or copy Google Apps Script for Google Sheets sync"
          >
            <Code2 size={13} className="text-forest" />
            <span className="hidden sm:inline">Apps Script</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={auditedEvents.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-2xs hover:bg-[#f8f9f5] transition cursor-pointer disabled:opacity-50"
            title="Download CSV report matching Google Sheets format"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Edit Categories & Keywords */}
          <button
            type="button"
            onClick={() => {
              setEditingCategories(categories);
              setShowConfigModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
          >
            <Settings2 size={13} />
            <span>Customize Rules</span>
          </button>
        </div>
      </div>

      {/* ─── Date Preset Filter Pills ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-black/[0.04] p-1 border border-black/5">
          {(
            [
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "14days", label: "Last 14 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "thisMonth", label: "This Month" },
              { id: "all", label: "All Loaded" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDatePreset(preset.id)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                datePreset === preset.id
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date window label */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium bg-[#fcfdfa] border border-line px-3 py-1 rounded-xl">
          <Calendar size={12} className="text-forest" />
          <span>
            {dateRangeBounds.start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {dateRangeBounds.end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-[#a2aaa2]">·</span>
          <span className="font-semibold text-ink">
            {auditedEvents.length} events
          </span>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Time */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">
              Total Logged
            </span>
            <Clock size={14} className="text-forest" />
          </div>
          <div className="text-[20px] sm:text-[23px] font-bold text-ink">
            {formatMinutes(categoryStats.totalMinutes)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            {formatHoursDecimal(categoryStats.totalMinutes)} total duration
          </div>
        </div>

        {/* Daily Average */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">
              Daily Average
            </span>
            <TrendingUp size={14} className="text-[#3b82f6]" />
          </div>
          <div className="text-[20px] sm:text-[23px] font-bold text-ink">
            {formatMinutes(dailyAverageMinutes)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            Over {daysInRange} day{daysInRange > 1 ? "s" : ""} in window
          </div>
        </div>

        {/* Top Category */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">
              Top Focus
            </span>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  categoryStats.list[0]?.category.color || "#1D9E75",
              }}
            />
          </div>
          <div className="text-[16px] sm:text-[18px] font-bold text-ink truncate">
            {categoryStats.list[0]?.category.name || "N/A"}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            {categoryStats.list[0]
              ? `${formatMinutes(categoryStats.list[0].minutes)} (${categoryStats.list[0].percentage.toFixed(1)}%)`
              : "No data"}
          </div>
        </div>

        {/* Events Count */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">
              Activities
            </span>
            <Sparkles size={14} className="text-[#f59e0b]" />
          </div>
          <div className="text-[20px] sm:text-[23px] font-bold text-ink">
            {categoryStats.totalEvents}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            {topActivities.length} unique activities
          </div>
        </div>
      </div>

      {/* ─── Visual Charts Row: Donut Chart & Top 15 Leaderboard ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-line bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-ink">
                  Time by Category
                </h3>
                <p className="text-[10px] text-muted">
                  Distribution of logged hours across buckets
                </p>
              </div>
              <span className="text-[10.5px] font-semibold text-muted bg-[#f5f6f2] px-2.5 py-1 rounded-lg">
                Donut Breakdown
              </span>
            </div>

            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center my-3 min-h-[220px]">
              {categoryStats.totalMinutes > 0 ? (
                (() => {
                  const size = 200;
                  const strokeWidth = 26;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  let cumulativePercentage = 0;

                  return (
                    <div className="relative">
                      <svg
                        width={size}
                        height={size}
                        className="-rotate-90 transform"
                      >
                        {categoryStats.list.map((item) => {
                          if (item.minutes <= 0) return null;
                          const sliceRatio = item.minutes / categoryStats.totalMinutes;
                          const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
                          const strokeDashoffset = -cumulativePercentage * circumference;
                          cumulativePercentage += sliceRatio;

                          const isHovered = hoveredCategory === item.category.id;

                          return (
                            <circle
                              key={item.category.id}
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              fill="transparent"
                              stroke={item.category.color}
                              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredCategory(item.category.id)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              onClick={() => {
                                setSelectedCategoryFilter((prev) =>
                                  prev === item.category.id ? "ALL" : item.category.id
                                );
                              }}
                            />
                          );
                        })}
                      </svg>

                      {/* Center Stats Display */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                          {hoveredCategory
                            ? categories.find((c) => c.id === hoveredCategory)?.name
                            : "Total Time"}
                        </span>
                        <span className="text-[19px] font-extrabold text-ink leading-tight">
                          {hoveredCategory
                            ? formatMinutes(
                                categoryStats.list.find(
                                  (c) => c.category.id === hoveredCategory
                                )?.minutes || 0
                              )
                            : formatMinutes(categoryStats.totalMinutes)}
                        </span>
                        <span className="text-[10px] font-semibold text-forest">
                          {hoveredCategory
                            ? `${(
                                categoryStats.list.find(
                                  (c) => c.category.id === hoveredCategory
                                )?.percentage || 0
                              ).toFixed(1)}%`
                            : `${categoryStats.totalEvents} events`}
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-muted">
                  <PieChartIcon size={32} className="opacity-30 mb-2" />
                  <p className="text-[12px] font-medium">No events logged in this range</p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="mt-4 pt-3 border-t border-black/5 space-y-1.5">
            {categoryStats.list
              .filter((c) => c.minutes > 0)
              .map((item) => (
                <div
                  key={item.category.id}
                  onClick={() => {
                    setSelectedCategoryFilter((prev) =>
                      prev === item.category.id ? "ALL" : item.category.id
                    );
                  }}
                  onMouseEnter={() => setHoveredCategory(item.category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg transition cursor-pointer ${
                    selectedCategoryFilter === item.category.id
                      ? "bg-forest/10 font-bold"
                      : "hover:bg-black/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.category.color }}
                    />
                    <span className="text-ink truncate">{item.category.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="font-mono text-ink font-semibold">
                      {formatMinutes(item.minutes)}
                    </span>
                    <span className="text-muted w-10 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Top 15 Activities Leaderboard */}
        <div className="lg:col-span-7 rounded-2xl border border-line bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-ink">
                  Top 15 Activities by Hours
                </h3>
                <p className="text-[10px] text-muted">
                  Ranking of where most of your time is spent
                </p>
              </div>
              <span className="text-[10.5px] font-semibold text-muted bg-[#f5f6f2] px-2.5 py-1 rounded-lg">
                Leaderboard
              </span>
            </div>

            {/* Top 15 List with Horizontal Bars */}
            {topActivities.length > 0 ? (
              <div className="space-y-2.5">
                {topActivities.map((act, idx) => {
                  const maxMinutes = topActivities[0]?.minutes || 1;
                  const barWidthPercent = (act.minutes / maxMinutes) * 100;

                  return (
                    <div
                      key={act.title}
                      className="group flex flex-col gap-1 p-1 rounded-lg hover:bg-[#fafbf8] transition"
                    >
                      <div className="flex items-center justify-between text-[11.5px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-[10px] font-mono font-bold text-muted/80">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-ink truncate">
                            {act.title}
                          </span>
                          <span
                            className="rounded-md px-1.5 py-0.2 text-[9.5px] font-semibold text-white shrink-0 hidden sm:inline-block"
                            style={{ backgroundColor: act.category.color }}
                          >
                            {act.category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-right shrink-0 font-mono">
                          <span className="font-bold text-ink">
                            {formatMinutes(act.minutes)}
                          </span>
                          <span className="text-muted text-[10px] w-9 text-right">
                            {act.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Fill */}
                      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidthPercent}%`,
                            backgroundColor: act.category.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-muted">
                <BarChart3 size={32} className="mx-auto text-muted/30 mb-2" />
                <p className="text-[12px]">No activity logs found for this date range.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Category Breakdown Cards ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
            <span>Category Breakdown & Keywords</span>
          </div>
          {selectedCategoryFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("ALL")}
              className="text-[11px] text-forest font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Show All Categories</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryStats.list.map(({ category: cat, minutes, count, percentage }) => {
            const isSelected = selectedCategoryFilter === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryFilter((prev) =>
                    prev === cat.id ? "ALL" : cat.id
                  );
                }}
                className={`group rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-2xs ${
                  isSelected
                    ? "border-forest ring-2 ring-forest/20 bg-forest/[0.02]"
                    : "border-line bg-white hover:border-black/20 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-xl text-white shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      {getCategoryIcon(cat.id)}
                    </span>
                    <div>
                      <h4 className="text-[12.5px] font-bold text-ink leading-tight">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] text-muted font-medium">
                        {count} event{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold font-mono text-ink">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="text-[18px] font-extrabold text-ink mb-2">
                  {formatMinutes(minutes)}
                </div>

                {/* Keyword preview pills */}
                <div className="pt-2 border-t border-black/[0.04]">
                  <p className="text-[9.5px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Matched Keywords ({cat.keys.length})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                    {cat.keys.length > 0 ? (
                      cat.keys.slice(0, 5).map((k) => (
                        <span
                          key={k}
                          className="rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[9.5px] text-[#555] font-mono"
                        >
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted italic">
                        Everything else
                      </span>
                    )}
                    {cat.keys.length > 5 && (
                      <span className="text-[9.5px] text-muted font-semibold">
                        +{cat.keys.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Detailed Event Activity Log ─── */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div>
            <h3 className="text-[13px] font-bold text-ink">
              Activity Event Log ({displayedEvents.length})
            </h3>
            <p className="text-[10px] text-muted">
              Row-by-row event logs matching current filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search filter */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-line bg-[#fafbf8] pl-8 pr-3 py-1.5 text-[11px] text-ink outline-none focus:border-forest transition w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Selector */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="rounded-xl border border-line bg-[#fafbf8] px-3 py-1.5 text-[11px] font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Event List Table */}
        {displayedEvents.length > 0 ? (
          <div className="divide-y divide-black/[0.04] overflow-x-auto">
            {displayedEvents.slice(0, 100).map((ev) => {
              const dateStr = ev.start.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const timeStr = ev.isAllDay
                ? "All Day"
                : `${ev.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${ev.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div
                  key={ev.id}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-[#fafbf8] transition gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: ev.category.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-ink truncate">
                        {ev.title}
                      </p>
                      <p className="text-[10px] text-muted flex items-center gap-1.5">
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span>{timeStr}</span>
                        {ev.calendarName && (
                          <>
                            <span>·</span>
                            <span className="truncate">{ev.calendarName}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <span
                      className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: ev.category.color }}
                    >
                      {ev.category.name}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-ink w-16 text-right">
                      {formatMinutes(ev.durationMinutes)}
                    </span>
                  </div>
                </div>
              );
            })}
            {displayedEvents.length > 100 && (
              <div className="py-3 text-center text-[11px] text-muted">
                Showing first 100 of {displayedEvents.length} events. Export to CSV to see all.
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted">
            <Filter size={24} className="mx-auto text-muted/40 mb-2" />
            <p className="text-[12px] font-medium">No events found matching your filter</p>
          </div>
        )}
      </div>

      {/* ─── MODAL: Customize Category Rules & Keywords ─── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-line bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/10 text-forest">
                  <Settings2 size={16} />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-ink">
                    Customize Categories & Keywords
                  </h3>
                  <p className="text-[10px] text-muted">
                    Calendar events containing these keywords are automatically assigned to their category
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body: List of categories with editable keywords */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 sidebar-scroll">
              {editingCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-line bg-[#fcfdfa] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cat.color}
                        onChange={(e) => {
                          const next = [...editingCategories];
                          next[idx] = { ...cat, color: e.target.value };
                          setEditingCategories(next);
                        }}
                        className="h-6 w-6 rounded-lg border border-black/15 cursor-pointer bg-transparent"
                        title="Change Category Color"
                      />
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const next = [...editingCategories];
                          next[idx] = { ...cat, name: e.target.value };
                          setEditingCategories(next);
                        }}
                        className="font-bold text-[13px] text-ink bg-transparent outline-none border-b border-transparent hover:border-black/20 focus:border-forest"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted">
                      {cat.keys.length} keyword{cat.keys.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Keywords pills */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {cat.keys.map((keyStr, kIdx) => (
                      <span
                        key={kIdx}
                        className="flex items-center gap-1 rounded-lg bg-white border border-black/10 px-2 py-0.5 text-[10.5px] font-mono text-ink shadow-2xs group"
                      >
                        <span>{keyStr}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...editingCategories];
                            next[idx] = {
                              ...cat,
                              keys: cat.keys.filter((_, i) => i !== kIdx),
                            };
                            setEditingCategories(next);
                          }}
                          className="text-muted hover:text-red-500 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}

                    {/* Add keyword input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="+ Add keyword..."
                        value={newKeywordInput[cat.id] || ""}
                        onChange={(e) =>
                          setNewKeywordInput((prev) => ({
                            ...prev,
                            [cat.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (newKeywordInput[cat.id] || "").trim().toLowerCase();
                            if (val && !cat.keys.includes(val)) {
                              const next = [...editingCategories];
                              next[idx] = { ...cat, keys: [...cat.keys, val] };
                              setEditingCategories(next);
                              setNewKeywordInput((prev) => ({ ...prev, [cat.id]: "" }));
                            }
                          }
                        }}
                        className="rounded-lg border border-line bg-white px-2 py-0.5 text-[10.5px] font-mono text-ink outline-none focus:border-forest w-28"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (newKeywordInput[cat.id] || "").trim().toLowerCase();
                          if (val && !cat.keys.includes(val)) {
                            const next = [...editingCategories];
                            next[idx] = { ...cat, keys: [...cat.keys, val] };
                            setEditingCategories(next);
                            setNewKeywordInput((prev) => ({ ...prev, [cat.id]: "" }));
                          }
                        }}
                        className="rounded-lg bg-black/5 hover:bg-black/10 p-1 text-ink cursor-pointer"
                        title="Add keyword"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-black/10 flex items-center justify-between bg-black/[0.02]">
              <button
                type="button"
                onClick={handleResetCategories}
                className="text-[11px] font-medium text-muted hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset to Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-xl px-3.5 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCategories(editingCategories)}
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
                >
                  Save Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Google Apps Script Code ─── */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-line bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/10 text-forest">
                  <Code2 size={16} />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-ink">
                    Google Apps Script for Google Sheets
                  </h3>
                  <p className="text-[10px] text-muted">
                    Sync calendar events directly to Google Sheets with automated charts and dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#1e1e1e] font-mono text-[11px] text-[#d4d4d4] sidebar-scroll leading-relaxed select-all">
              <pre>{CLEAN_GOOGLE_APPS_SCRIPT}</pre>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-black/10 flex items-center justify-between bg-black/[0.02]">
              <span className="text-[11px] text-muted">
                Also saved in <code className="font-mono text-ink">scripts/google-apps-script-calendar-sync.js</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="rounded-xl px-3.5 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedScript ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedScript ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
