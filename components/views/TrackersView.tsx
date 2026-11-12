"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  Wallet,
  Briefcase,
  Hourglass,
  Laptop,
  RefreshCw,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Building2,
  MapPin,
  Check,
  X,
  CreditCard,
  DollarSign,
  Share2,
  GraduationCap,
  Award,
  Landmark,
} from "lucide-react";
import type {
  TrackersData,
  TrackerEBReading,
  TrackerExpense,
  TrackerJobApplication,
} from "@/types/dashboard";
import { SEED_TRACKERS_DATA } from "@/lib/trackersSync";

type TabKey = "eb" | "expenses" | "investments" | "placements" | "life" | "purchases";

export function TrackersView() {
  const [activeTab, setActiveTab] = useState<TabKey>("eb");
  const [data, setData] = useState<TrackersData>(SEED_TRACKERS_DATA);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncStr, setLastSyncStr] = useState<string>("Just now");

  // Filtering states
  const [selectedJournalKey, setSelectedJournalKey] = useState<string>("2026");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseVisibleCount, setExpenseVisibleCount] = useState<number>(50);
  const [ebCycleFilter, setEbCycleFilter] = useState("all");
  const [ebReadingsVisibleCount, setEbReadingsVisibleCount] = useState<number>(20);
  const [placementSearch, setPlacementSearch] = useState("");
  const [placementStatusFilter, setPlacementStatusFilter] = useState("all");

  // Modals
  const [showAddReadingModal, setShowAddReadingModal] = useState(false);
  const [newReadingVal, setNewReadingVal] = useState("");
  const [newReadingCycle, setNewReadingCycle] = useState("Nov");

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseItem, setNewExpenseItem] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("Food and Grocery");
  const [newExpenseNotes, setNewExpenseNotes] = useState("");

  // Sync handler
  const handleSync = useCallback(async (force = true) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/trackers/sync${force ? "?force=true" : ""}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setLastSyncStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setSyncError(json.error || "Could not sync latest rows.");
      }
    } catch (err) {
      setSyncError("Network error while syncing Google Sheet.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync on mount and background refresh every 10 minutes
  useEffect(() => {
    handleSync(false);
    const interval = setInterval(() => {
      handleSync(false);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [handleSync]);

  // Submit new EB reading
  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReadingVal) return;
    try {
      const res = await fetch("/api/trackers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_eb_reading",
          payload: {
            meterReading: parseFloat(newReadingVal),
            billingCycle: newReadingCycle,
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setShowAddReadingModal(false);
        setNewReadingVal("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseItem || !newExpenseAmount) return;
    try {
      const res = await fetch("/api/trackers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_expense",
          payload: {
            item: newExpenseItem,
            amount: parseFloat(newExpenseAmount),
            category: newExpenseCategory,
            notes: newExpenseNotes,
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setShowAddExpenseModal(false);
        setNewExpenseItem("");
        setNewExpenseAmount("");
        setNewExpenseNotes("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Computed values ── */
  // Journal sub-sections metadata
  const journalTabs = useMemo(() => [
    { key: "2026", label: "2026 Journal", count: data.journals?.["2026"]?.expenses?.length ?? data.expenses.length },
    { key: "2026-fampay", label: "2026 Fam Pay", count: data.journals?.["2026-fampay"]?.expenses?.length ?? 0 },
    { key: "2025", label: "2025 Journal", count: data.journals?.["2025"]?.expenses?.length ?? 0 },
    { key: "2025-fampay", label: "2025 Fam Pay", count: data.journals?.["2025-fampay"]?.expenses?.length ?? 0 },
    { key: "2024", label: "2024 Journal", count: data.journals?.["2024"]?.expenses?.length ?? 0 },
    { key: "2024-fampay", label: "2024 Fam Pay", count: data.journals?.["2024-fampay"]?.expenses?.length ?? 0 },
    { key: "2023", label: "2023 Journal", count: data.journals?.["2023"]?.expenses?.length ?? 0 },
    { key: "pg", label: "PG Living Expenses", count: data.journals?.["pg"]?.expenses?.length ?? 0 },
  ], [data.journals, data.expenses]);

  const activeJournal = useMemo(() => {
    return data.journals?.[selectedJournalKey] || {
      key: selectedJournalKey,
      title: "2026 Journal",
      year: 2026,
      totalSpent: 0,
      totalIncome: 0,
      expenses: data.expenses,
    };
  }, [data.journals, selectedJournalKey, data.expenses]);

  // Expenses filtering & robust sorting (latest on top)
  const filteredExpenses = useMemo(() => {
    const rawList = activeJournal.expenses || [];
    const list = rawList.filter((exp) => {
      const matchesSearch =
        exp.item.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.category.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
      if (!matchesSearch) return false;

      if (expenseCategoryFilter !== "all") {
        if (exp.category.toLowerCase() !== expenseCategoryFilter.toLowerCase()) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      // 1. If explicit year/month/day present, sort descending
      if (a.year && b.year && a.month && b.month && a.day && b.day) {
        const valA = a.year * 10000 + a.month * 100 + a.day;
        const valB = b.year * 10000 + b.month * 100 + b.day;
        if (valB !== valA) return valB - valA;
      }
      // 2. Parse date strings
      const tA = new Date(a.dateStr).getTime();
      const tB = new Date(b.dateStr).getTime();
      if (!isNaN(tA) && !isNaN(tB) && tB !== tA) {
        return tB - tA;
      }
      return 0;
    });
  }, [activeJournal.expenses, expenseSearch, expenseCategoryFilter]);

  // Category Budgets sorted (active & highest budget on top)
  const sortedCategoryBudgets = useMemo(() => {
    return [...data.categoryBudgets].sort((a, b) => {
      if (a.budget > 0 && b.budget === 0) return -1;
      if (a.budget === 0 && b.budget > 0) return 1;
      return b.budget - a.budget;
    });
  }, [data.categoryBudgets]);

  // Unique expense categories for filter chips
  const expenseCategories = useMemo(() => {
    const set = new Set<string>();
    (activeJournal.expenses || []).forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).slice(0, 12);
  }, [activeJournal.expenses]);

  // Total expenses recorded in active journal
  const totalActiveJournalExpense = useMemo(() => {
    return (activeJournal.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [activeJournal.expenses]);

  // EB readings filtered & sorted (recent on top to bottom)
  const filteredReadings = useMemo(() => {
    const list = ebCycleFilter === "all"
      ? data.ebReadings
      : data.ebReadings.filter((r) => r.billingCycle.toLowerCase() === ebCycleFilter.toLowerCase());

    return [...list].sort((a, b) => {
      // Recent on top: highest meter reading first
      if (b.meterReading !== a.meterReading) {
        return b.meterReading - a.meterReading;
      }
      const tA = new Date(a.dateTimeStr).getTime();
      const tB = new Date(b.dateTimeStr).getTime();
      if (!isNaN(tA) && !isNaN(tB)) {
        return tB - tA;
      }
      return 0;
    });
  }, [data.ebReadings, ebCycleFilter]);

  // EB cycles sorted (latest cycle first: Nov, Oct, Sep, Aug)
  const sortedEbCycles = useMemo(() => {
    const cycleOrder: Record<string, number> = { nov: 4, dec: 5, oct: 3, sep: 2, aug: 1 };
    return [...data.ebCycles].sort((a, b) => {
      const orderA = cycleOrder[a.cycle.toLowerCase()] || 0;
      const orderB = cycleOrder[b.cycle.toLowerCase()] || 0;
      return orderB - orderA;
    });
  }, [data.ebCycles]);

  // Placement applications filtered
  const filteredPlacements = useMemo(() => {
    return data.jobApplications.filter((job) => {
      const matchSearch =
        job.company.toLowerCase().includes(placementSearch.toLowerCase()) ||
        job.role.toLowerCase().includes(placementSearch.toLowerCase()) ||
        job.location.toLowerCase().includes(placementSearch.toLowerCase());
      if (!matchSearch) return false;

      if (placementStatusFilter !== "all") {
        if (job.status.toLowerCase() !== placementStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [data.jobApplications, placementSearch, placementStatusFilter]);

  // Total purchases value
  const totalPurchaseValue = useMemo(() => {
    return data.purchases.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [data.purchases]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header & Sync Controls ─── */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[20px] font-bold text-ink tracking-tight">Trackers Hub</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[10.5px] font-bold text-[#047857]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Personal ledger, PG electricity readings, job applications & life metrics synced from Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <a
            href={data.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-medium text-ink hover:bg-[#f8f9f5] transition shadow-xs"
          >
            <ExternalLink size={13} className="text-muted" /> Open Sheet
          </a>

          <button
            onClick={() => handleSync(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-3.5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition disabled:opacity-60"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync Sheet"}
          </button>
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-[#fed7aa] bg-[#fffbeb] p-3 text-[12px] text-[#9a3412] flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{syncError}</span>
        </div>
      )}

      {/* ─── Navigation Tabs ─── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {[
          { key: "eb", label: "PG Electricity (EB)", icon: Zap, count: `${data.ebMeta.latestReading} units` },
          { key: "expenses", label: "Expense & Budget", icon: Wallet, count: `₹${data.totalMonthlyBudget.toLocaleString()}` },
          { key: "investments", label: "Investment Journal", icon: TrendingUp, count: `${data.investments?.grandTotalFormatted || "₹22.76L"}` },
          { key: "placements", label: "Placements & Career", icon: Briefcase, count: `${data.jobApplications.length}` },
          { key: "life", label: "Time on Earth", icon: Hourglass, count: `${data.lifeStats.ageYears} yrs` },
          { key: "purchases", label: "Gadgets & Assets", icon: Laptop, count: `${data.purchases.length}` },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition ${
              activeTab === key
                ? "bg-forest text-white shadow-xs"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed] hover:text-ink"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === key ? "bg-white/20 text-white" : "bg-[#f0f2eb] text-[#6b756c]"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: PG ELECTRICITY (EB) METER TRACKER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "eb" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Latest Reading</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">{data.ebMeta.latestReading} <span className="text-[13px] font-normal text-muted">units</span></p>
              <p className="mt-1 text-[10.5px] text-[#059669] flex items-center gap-1 font-medium">
                <Clock size={11} /> {data.ebMeta.latestReadingDate || "Latest Nov reading"}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Current Rate</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">₹{data.ebMeta.currentRate} <span className="text-[13px] font-normal text-muted">/ unit</span></p>
              <p className="mt-1 text-[10.5px] text-muted">Was ₹{data.ebMeta.rateTillSep}/unit till Sep</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Nov Running Cycle</span>
              <p className="mt-1 text-[22px] font-bold text-[#b45309] tracking-tight">
                0.06 <span className="text-[13px] font-normal text-muted">units</span>
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Cost ₹0.72 · 50% split</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">My Share (Running)</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">₹0.36</p>
              <p className="mt-1 text-[10.5px] text-muted">2 People Sharing</p>
            </div>
          </div>

          {/* Billing Cycles Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Billing Cycles History</h3>
              <span className="text-[11px] text-muted">50/50 split with roommate</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sortedEbCycles.map((cyc) => (
                <div key={cyc.cycle} className="rounded-2xl border border-line bg-white p-4 shadow-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-[#f0f2eb] px-2.5 py-1 text-[12px] font-bold text-ink">
                        {cyc.cycle} Cycle
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                          cyc.status === "Paid"
                            ? "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                            : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                        }`}
                      >
                        {cyc.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11.5px] text-muted">Units Consumed</span>
                        <span className="text-[13px] font-bold text-ink">{cyc.unitsUsed} units</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11.5px] text-muted">Total Billed</span>
                        <span className="text-[13px] font-semibold text-ink">₹{cyc.billedAmount ?? cyc.computedCost}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1 border-t border-[#f0f2eb]">
                        <span className="text-[12px] font-bold text-forest">My Share (Paid)</span>
                        <span className="text-[14px] font-extrabold text-forest">₹{cyc.myShare}</span>
                      </div>
                    </div>
                  </div>

                  {cyc.notes && (
                    <p className="mt-3 text-[10px] text-muted bg-[#fafbf7] p-2 rounded-lg border border-[#f0f2eb] line-clamp-2">
                      {cyc.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meter Readings Table */}
          <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
            <div className="p-4 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fbfcf8]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-ink">Meter Photo & Reading Logs</h4>
                  <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[9.5px] font-bold text-[#047857]">
                    Recent on top
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Showing {Math.min(ebReadingsVisibleCount, filteredReadings.length)} of {filteredReadings.length} readings (most recent on top)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-line rounded-xl px-2 py-1 text-[11px]">
                  <span className="text-muted">Cycle:</span>
                  {["all", "Nov", "Oct", "Sep", "Aug"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setEbCycleFilter(c)}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition ${
                        ebCycleFilter === c ? "bg-forest text-white" : "text-muted hover:text-ink"
                      }`}
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddReadingModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition"
                >
                  <Plus size={12} /> Log Reading
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-[#fafbf7] text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-4 text-right">Meter Reading</th>
                    <th className="py-2.5 px-4 text-right">Units Consumed</th>
                    <th className="py-2.5 px-4 text-right">Computed Cost</th>
                    <th className="py-2.5 px-4 text-right">Units / Day</th>
                    <th className="py-2.5 px-4 text-center">Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff1ec]">
                  {filteredReadings.slice(0, ebReadingsVisibleCount).map((row) => (
                    <tr key={row.id} className="hover:bg-[#fbfcf9] transition">
                      <td className="py-2.5 px-4 font-medium text-ink">{row.dateTimeStr}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-ink">{row.meterReading.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right text-muted">
                        {row.unitsUsed !== null && row.unitsUsed !== undefined ? `+${row.unitsUsed.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-forest">
                        {row.cost !== null && row.cost !== undefined ? `₹${row.cost.toFixed(1)}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted">
                        {row.unitsPerDay !== null && row.unitsPerDay !== undefined ? `${row.unitsPerDay.toFixed(2)}/d` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-[#f1f3ed] text-[#475248]">
                          {row.billingCycle}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReadings.length > ebReadingsVisibleCount && (
              <div className="p-3 text-center border-t border-line bg-[#fbfcf8]">
                <button
                  onClick={() => setEbReadingsVisibleCount((prev) => prev + 20)}
                  className="rounded-xl border border-line bg-white px-4 py-1.5 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-xs"
                >
                  Show More (Showing {Math.min(ebReadingsVisibleCount, filteredReadings.length)} of {filteredReadings.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: EXPENSES & BUDGET TRACKER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          {/* Sub-Section Journal Selector */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[13.5px] font-bold text-ink">Expense Journals & Archives</h3>
                <p className="text-[11px] text-muted">Select yearly ledger or FamPay / PG journals</p>
              </div>
              <span className="text-[11px] font-semibold text-forest bg-[#f0f2eb] px-2.5 py-1 rounded-lg self-start sm:self-auto">
                Viewing: {activeJournal.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {journalTabs.map((j) => (
                <button
                  key={j.key}
                  onClick={() => {
                    setSelectedJournalKey(j.key);
                    setExpenseVisibleCount(50);
                    setExpenseCategoryFilter("all");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11.5px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedJournalKey === j.key
                      ? "bg-forest text-white shadow-xs"
                      : "bg-[#fbfcf9] border border-line text-muted hover:bg-[#f1f3ed] hover:text-ink"
                  }`}
                >
                  <span>{j.label}</span>
                  {j.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold ${
                        selectedJournalKey === j.key ? "bg-white/20 text-white" : "bg-[#eff1ec] text-[#556056]"
                      }`}
                    >
                      {j.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Top KPI Cards for Selected Journal */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Recorded Spent</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                ₹{(activeJournal.totalSpent || totalActiveJournalExpense).toLocaleString()}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">In {activeJournal.title}</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Journal Entries</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">{activeJournal.expenses.length}</p>
              <p className="mt-1 text-[10.5px] text-muted">Recorded debits & credits</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Latest Balance</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                {activeJournal.latestBalance !== null && activeJournal.latestBalance !== undefined
                  ? `₹${activeJournal.latestBalance.toLocaleString()}`
                  : "—"}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">As per latest transaction</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Income / Credits</span>
              <p className="mt-1 text-[22px] font-bold text-[#059669] tracking-tight">
                ₹{(activeJournal.totalIncome || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Recorded credits</p>
            </div>
          </div>

          {/* Category Budgets Grid (for 2026 or active budget) */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Category Monthly Budgets</h3>
                <p className="text-[11px] text-muted">Planned budget limits for each spending category</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition"
              >
                <Plus size={13} /> Log Expense
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedCategoryBudgets.map((cb) => (
                <div key={cb.category} className="rounded-xl border border-[#eff1ec] bg-[#fbfcf9] p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">{cb.category}</p>
                    <p className="text-[11px] text-muted mt-0.5">Budget: ₹{cb.budget.toLocaleString()}</p>
                  </div>
                  <span className="rounded-lg bg-white border border-line px-2.5 py-1 text-[12px] font-bold text-forest shadow-2xs">
                    ₹{cb.budget}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
            <div className="p-4 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fbfcf8]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-ink">{activeJournal.title}</h4>
                  <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[9.5px] font-bold text-[#047857]">
                    Latest on top
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Showing {Math.min(expenseVisibleCount, filteredExpenses.length)} of {filteredExpenses.length} transactions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Search expenses..."
                    className="h-8 w-44 rounded-xl border border-line bg-white pl-8 pr-3 text-[11px] text-ink placeholder:text-muted focus:border-forest focus:outline-none"
                  />
                </div>

                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="h-8 rounded-xl border border-line bg-white px-2.5 text-[11px] font-medium text-ink focus:border-forest focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-[#fafbf7] text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff1ec]">
                  {filteredExpenses.slice(0, expenseVisibleCount).map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#fbfcf9] transition">
                      <td className="py-2.5 px-4 text-muted whitespace-nowrap">{exp.dateStr}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-ink">{exp.item}</span>
                        {exp.notes && (
                          <span className="block text-[10.5px] text-muted mt-0.5 line-clamp-1">{exp.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-[#f1f3ed] text-[#475248]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold whitespace-nowrap">
                        {exp.income ? (
                          <span className="text-[#059669]">+₹{exp.income.toLocaleString()}</span>
                        ) : (
                          <span className="text-ink">₹{exp.amount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted whitespace-nowrap">
                        {exp.balance ? `₹${exp.balance.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length > expenseVisibleCount && (
              <div className="p-3 text-center border-t border-line bg-[#fbfcf8]">
                <button
                  onClick={() => setExpenseVisibleCount((prev) => prev + 50)}
                  className="rounded-xl border border-line bg-white px-4 py-1.5 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-xs"
                >
                  Show More (Showing {expenseVisibleCount} of {filteredExpenses.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: INVESTMENT JOURNAL (EDUCATION & LIFETIME LEDGER)
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "investments" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Grand Total Investment</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">
                {data.investments.grandTotalFormatted || "₹22,76,000"}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Pre-School through University Degree</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">University (B.Tech)</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                ₹{(data.investments.universityTotal || 2164500).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">4 Years Fees, Hostel & Exams</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Schooling (K-12)</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                ₹{(data.investments.schoolTotal || 112500).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Pre-K through 12th Grade</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Merit Scholarship</span>
              <p className="mt-1 text-[22px] font-bold text-[#059669] tracking-tight">
                ₹{(data.investments.scholarshipEarned || 130000).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">35% Tuition Waiver in 1st Year</p>
            </div>
          </div>

          {/* Education Level Breakdown Cards */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Lifetime Education Progression</h3>
                <p className="text-[11px] text-muted">Complete breakdown from Pre-School to Engineering Graduation</p>
              </div>
              <span className="rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 text-[11px] font-bold text-[#047857]">
                Grand Total: {data.investments.grandTotalFormatted || "₹22,76,000"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.investments.levels.map((lvl, idx) => (
                <div key={lvl.level} className="rounded-xl border border-[#eff1ec] bg-[#fbfcf9] p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase block">Phase {idx + 1} · {lvl.years}</span>
                    <p className="text-[12px] font-bold text-ink mt-1 line-clamp-2">{lvl.level}</p>
                    {lvl.notes && (
                      <p className="text-[10.5px] text-muted mt-1 leading-snug">{lvl.notes}</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#eff1ec] flex items-center justify-between">
                    <span className="text-[10.5px] text-muted font-medium">Expense</span>
                    <span className="text-[12.5px] font-bold text-forest">₹{lvl.totalExpense.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* University Year-by-Year Table */}
          <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
            <div className="p-4 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fbfcf8]">
              <div>
                <h4 className="text-[13px] font-bold text-ink">University Fee Breakdown (1st to 4th Year)</h4>
                <p className="text-[11px] text-muted">Tuition, 35% scholarship, hostel fee & examination charges</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#f0f2eb] px-2.5 py-1 text-[11px] font-semibold text-[#475248]">
                  Deposit: ₹{data.investments.depositFee?.toLocaleString("en-IN") || "45,000"}
                </span>
                <span className="rounded-lg bg-[#f0f2eb] px-2.5 py-1 text-[11px] font-semibold text-[#475248]">
                  Alumni: ₹{data.investments.alumniFee?.toLocaleString("en-IN") || "1,500"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-[#fafbf7] text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-4">Academic Year</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4 text-right">Base Tuition</th>
                    <th className="py-2.5 px-4 text-right">Scholarship</th>
                    <th className="py-2.5 px-4 text-right">Net Tuition</th>
                    <th className="py-2.5 px-4 text-right">Hostel Fee</th>
                    <th className="py-2.5 px-4 text-right">Exam Fee</th>
                    <th className="py-2.5 px-4 text-right">Total Annual</th>
                    <th className="py-2.5 px-4 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff1ec]">
                  {data.investments.universityYears.map((yr) => (
                    <tr key={yr.year} className="hover:bg-[#fbfcf9] transition">
                      <td className="py-3 px-4 font-semibold text-ink whitespace-nowrap">{yr.year}</td>
                      <td className="py-3 px-4">
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-[#f1f3ed] text-[#475248]">
                          {yr.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted whitespace-nowrap">₹{yr.tuitionFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {yr.scholarship > 0 ? (
                          <span className="text-[#059669] font-semibold">-₹{yr.scholarship.toLocaleString("en-IN")} (35%)</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-ink whitespace-nowrap">₹{yr.netTuition.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right text-muted whitespace-nowrap">₹{yr.hostelFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right text-muted whitespace-nowrap">₹{yr.examCharges.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-bold text-forest whitespace-nowrap">₹{yr.totalAnnualFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-semibold text-ink whitespace-nowrap">₹{yr.cumulativeExpense.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#fbfcf8] font-bold border-t border-line">
                    <td colSpan={2} className="py-2.5 px-4 text-ink">Other Mandatory Charges</td>
                    <td colSpan={5} className="py-2.5 px-4 text-muted text-[11px]">One-Time Refundable Deposit (₹45,000) + Alumni Contribution (₹1,500)</td>
                    <td className="py-2.5 px-4 text-right text-forest">₹46,500</td>
                    <td className="py-2.5 px-4 text-right text-forest">₹21,64,500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Contributors & Semester Funding */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Family & Supporter Contributions</h3>
                <p className="text-[11px] text-muted">Education funding support recorded for 6th Semester (₹2,80,000 Total)</p>
              </div>
              <span className="rounded-xl bg-[#f0f2eb] px-3 py-1 text-[11px] font-bold text-ink">
                6th Semester Fund
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.investments.contributors.map((c) => (
                <div key={c.name} className="rounded-xl border border-[#eff1ec] bg-[#fbfcf9] p-3.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12.5px] font-bold text-ink">{c.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">Education Support</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        c.status === "Paid"
                          ? "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                          : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#eff1ec] flex items-center justify-between">
                    <span className="text-[10px] text-muted">Amount</span>
                    <span className="text-[13px] font-extrabold text-forest">₹{c.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: PLACEMENT & CAREER TRACKER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "placements" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Applied</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">{data.jobApplications.length}</p>
              <p className="mt-1 text-[10.5px] text-muted">Via Superset & Portals</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Active / In Process</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">
                {data.jobApplications.filter((j) => !j.status.toLowerCase().includes("reject")).length}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Awaiting OA / Interview</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Top Source</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">Superset</p>
              <p className="mt-1 text-[10.5px] text-muted">Campus placement portal</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Latest Action</span>
              <p className="mt-1 text-[16px] font-bold text-forest tracking-tight truncate">Wait / Assessment</p>
              <p className="mt-1 text-[10.5px] text-muted">Interview preparation</p>
            </div>
          </div>

          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={placementSearch}
                onChange={(e) => setPlacementSearch(e.target.value)}
                placeholder="Search company, role or location..."
                className="h-9 w-full sm:w-72 rounded-xl border border-line bg-white pl-9 pr-3 text-[12px] text-ink placeholder:text-muted focus:border-forest focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "Applied", "Rejected", "Did Not Attend"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPlacementStatusFilter(st)}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                    placementStatusFilter === st
                      ? "bg-forest text-white"
                      : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Job Applications List / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlacements.map((job) => (
              <div key={job.id} className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col justify-between hover:border-forest/40 transition">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f0f2eb] text-[#3e483f] font-bold text-[13px]">
                          {job.company.charAt(0)}
                        </span>
                        <div>
                          <h4 className="text-[14px] font-bold text-ink leading-tight truncate">{job.company}</h4>
                          <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {job.location || "Remote / Co-located"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        job.status.toLowerCase().includes("reject")
                          ? "bg-[#fee2e2] text-[#991b1b]"
                          : job.status.toLowerCase().includes("offer")
                          ? "bg-[#ecfdf5] text-[#047857]"
                          : "bg-[#eff6ff] text-[#1d4ed8]"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="mt-3 text-[12.5px] font-medium text-ink">{job.role}</p>

                  {job.notes && (
                    <p className="mt-2 text-[11px] text-[#4d564e] bg-[#fbfcf9] p-2.5 rounded-xl border border-[#eff1ec] leading-relaxed">
                      {job.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f2eb] flex items-center justify-between text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} /> {job.source}
                  </span>
                  <span>Applied: {job.appliedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: LIFE & PERSPECTIVE ("TIME SPENT ON EARTH")
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "life" && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="rounded-3xl border border-line bg-gradient-to-br from-[#1a2e26] via-[#1c2e26] to-[#14241d] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#a7f3d0]">
                Life Perspective Odometer
              </span>
              <h3 className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight">
                {data.lifeStats.ageYears} Years on Earth
              </h3>
              <p className="mt-1 text-[13px] text-white/70">
                Born on {data.lifeStats.birthdate}. Every moment recorded is time well lived.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/10">
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-white/50 block">Next Birthday</span>
                  <span className="text-[18px] font-bold text-[#fde047]">{data.lifeStats.daysUntilNextBirthday} days</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-white/50 block">Weeks Lived</span>
                  <span className="text-[18px] font-bold text-white">{data.lifeStats.totalWeeks.toLocaleString()} weeks</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-white/50 block">Total Days</span>
                  <span className="text-[18px] font-bold text-white">{data.lifeStats.totalDays.toLocaleString()} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Odometer Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Days", val: data.lifeStats.totalDays.toLocaleString() },
              { label: "Total Months", val: data.lifeStats.totalMonths.toLocaleString() },
              { label: "Total Weeks", val: data.lifeStats.totalWeeks.toLocaleString() },
              { label: "Hours Lived", val: data.lifeStats.totalHours.toLocaleString() },
              { label: "Minutes Lived", val: data.lifeStats.totalMinutes.toLocaleString() },
              { label: "Seconds Lived", val: data.lifeStats.totalSeconds.toLocaleString() },
              { label: "Current Age", val: `${data.lifeStats.ageYears} Years` },
              { label: "Next Milestone", val: "22 Years" },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <span className="text-[10.5px] font-semibold text-muted uppercase tracking-wider">{label}</span>
                <p className="mt-1 text-[20px] font-bold text-ink tracking-tight">{val}</p>
              </div>
            ))}
          </div>

          {/* Interplanetary Ages Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-forest" />
              <h3 className="text-[14px] font-bold text-ink">Age on Other Planets</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-line bg-[#fbfcf9] p-4 text-center">
                <span className="text-[11px] font-bold text-muted uppercase">Mercury</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink">{data.lifeStats.planetAges.mercury} <span className="text-[11px] font-normal text-muted">yrs</span></p>
                <span className="text-[10px] text-muted">88-day orbit</span>
              </div>
              <div className="rounded-xl border border-line bg-[#fbfcf9] p-4 text-center">
                <span className="text-[11px] font-bold text-muted uppercase">Venus</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink">{data.lifeStats.planetAges.venus} <span className="text-[11px] font-normal text-muted">yrs</span></p>
                <span className="text-[10px] text-muted">225-day orbit</span>
              </div>
              <div className="rounded-xl border border-line bg-[#fbfcf9] p-4 text-center">
                <span className="text-[11px] font-bold text-muted uppercase">Mars</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink">{data.lifeStats.planetAges.mars} <span className="text-[11px] font-normal text-muted">yrs</span></p>
                <span className="text-[10px] text-muted">687-day orbit</span>
              </div>
              <div className="rounded-xl border border-line bg-[#fbfcf9] p-4 text-center">
                <span className="text-[11px] font-bold text-muted uppercase">Jupiter</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink">{data.lifeStats.planetAges.jupiter} <span className="text-[11px] font-normal text-muted">yrs</span></p>
                <span className="text-[10px] text-muted">11.86-year orbit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: GADGETS & PURCHASES TRACKER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "purchases" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Tech Value</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">₹{totalPurchaseValue.toLocaleString()}</p>
              <p className="mt-1 text-[10.5px] text-muted">Hardware & gadgets inventory</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Devices Logged</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">{data.purchases.length}</p>
              <p className="mt-1 text-[10.5px] text-muted">Tracked with warranty dates</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Primary Ecosystem</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">Apple</p>
              <p className="mt-1 text-[10.5px] text-muted">MacBook, iPad, iPhone</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Warranty / AppleCare</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">Active</p>
              <p className="mt-1 text-[10.5px] text-muted">Protected assets</p>
            </div>
          </div>

          {/* Purchases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.purchases.map((p) => (
              <div key={p.sNo} className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{p.brand}</span>
                      <h4 className="text-[15px] font-bold text-ink">{p.product}</h4>
                      <p className="text-[11.5px] text-muted mt-0.5">{p.model}</p>
                    </div>

                    <span className="rounded-xl bg-[#f0f2eb] px-3 py-1 text-[13px] font-extrabold text-forest shrink-0">
                      {p.priceFormatted}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-[#fbfcf9] p-3 rounded-xl border border-[#eff1ec]">
                    <div>
                      <span className="text-muted block text-[10px]">Purchased</span>
                      <span className="font-semibold text-ink">{p.orderDate}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Seller</span>
                      <span className="font-semibold text-ink truncate block">{p.seller}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Payment Mode</span>
                      <span className="font-semibold text-ink">{p.paymentMode}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Age Since Delivery</span>
                      <span className="font-semibold text-forest truncate block">{p.timeSinceDelivery}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modal: Log EB Reading ─── */}
      {showAddReadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-line animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-[14px] font-bold text-ink">Log Meter Reading</h3>
              <button onClick={() => setShowAddReadingModal(false)} className="text-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddReading} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Meter Reading (Units)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 320.5"
                  value={newReadingVal}
                  onChange={(e) => setNewReadingVal(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[13px] text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Billing Cycle</label>
                <select
                  value={newReadingCycle}
                  onChange={(e) => setNewReadingCycle(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[12px] text-ink focus:border-forest focus:outline-none"
                >
                  <option value="Nov">November</option>
                  <option value="Dec">December</option>
                  <option value="Oct">October</option>
                  <option value="Sep">September</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReadingModal(false)}
                  className="rounded-xl border border-line px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-[#f1f3ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116]"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Log Expense ─── */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-line animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-[14px] font-bold text-ink">Log New Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Item / Merchant</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Metro, Snacks"
                  value={newExpenseItem}
                  onChange={(e) => setNewExpenseItem(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[13px] text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[13px] text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Category</label>
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[12px] text-ink focus:border-forest focus:outline-none"
                >
                  <option value="Food and Grocery">Food & Grocery</option>
                  <option value="Commute">Commute</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Investments">Investments</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Mobile & Internet">Mobile & Internet</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional context"
                  value={newExpenseNotes}
                  onChange={(e) => setNewExpenseNotes(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[12px] text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="rounded-xl border border-line px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-[#f1f3ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116]"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
