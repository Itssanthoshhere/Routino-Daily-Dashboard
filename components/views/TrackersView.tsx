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
  Key,
  ShieldCheck,
  Copy,
  Activity,
  Download,
} from "lucide-react";
import type {
  TrackersData,
  TrackerEBReading,
  TrackerExpense,
  TrackerJobApplication,
  TrackerAntigravityToken,
} from "@/types/dashboard";
import { SEED_TRACKERS_DATA } from "@/lib/trackersSync";

type TabKey = "eb" | "expenses" | "tokens" | "investments" | "placements" | "life" | "purchases";

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
  const [placementSourceFilter, setPlacementSourceFilter] = useState("all");

  // Antigravity Tokens filters
  const [tokenSearch, setTokenSearch] = useState("");
  const [tokenStatusFilter, setTokenStatusFilter] = useState("all");
  const [tokenProfileFilter, setTokenProfileFilter] = useState("all");
  const [tokenSort, setTokenSort] = useState<"cooldown-first" | "available-first" | "days-asc" | "email">("cooldown-first");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [tokenBatchCopied, setTokenBatchCopied] = useState<string | null>(null);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1800);
  };

  const handleCopyNextReady = () => {
    const readyList = (data.antigravityTokens || []).filter((t) => t.isAvailable);
    if (readyList.length === 0) return;
    const next = readyList[0];
    navigator.clipboard.writeText(next.email);
    setCopiedEmail(next.email);
    setTokenBatchCopied(`Copied next ready: ${next.email}`);
    setTimeout(() => {
      setCopiedEmail(null);
      setTokenBatchCopied(null);
    }, 2500);
  };

  const handleCopyAllReady = () => {
    const readyEmails = (data.antigravityTokens || [])
      .filter((t) => t.isAvailable)
      .map((t) => t.email);
    if (readyEmails.length === 0) return;
    navigator.clipboard.writeText(readyEmails.join("\n"));
    setTokenBatchCopied(`Copied ${readyEmails.length} ready emails!`);
    setTimeout(() => setTokenBatchCopied(null), 2500);
  };

  // Modals
  const [showAddReadingModal, setShowAddReadingModal] = useState(false);
  const [newReadingVal, setNewReadingVal] = useState("");
  const [newReadingCycle, setNewReadingCycle] = useState("Nov");
  const [newReadingDateTime, setNewReadingDateTime] = useState("");

  const openAddReadingModal = () => {
    setNewReadingVal("");
    setNewReadingCycle("Nov");
    setNewReadingDateTime(
      new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
    setShowAddReadingModal(true);
  };

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseItem, setNewExpenseItem] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("Food and Grocery");
  const [newExpenseNotes, setNewExpenseNotes] = useState("");

  // Auto-sync preferences
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState<number>(30); // 30s background auto-sync
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);

  // Sync handler (supports silent background sync without locking UI)
  const handleSync = useCallback(async (force = true, isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/trackers/sync${force ? "?force=true" : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setLastSyncStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        if (!isSilent) setSyncError(json.error || "Could not sync latest rows.");
      }
    } catch {
      if (!isSilent) setSyncError("Network error while syncing Google Sheet.");
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, []);

  // 1. Initial sync on mount
  useEffect(() => {
    handleSync(false);
  }, [handleSync]);

  // 2. Active background polling interval (every 30s when tab is visible)
  useEffect(() => {
    if (!autoSyncEnabled || autoSyncIntervalSec <= 0) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        handleSync(true, true);
      }
    }, autoSyncIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, autoSyncIntervalSec, handleSync]);

  // 3. Tab Visibility & Window Focus: Sync automatically without refreshing when switching back from Google Sheets!
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        handleSync(true, true);
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
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
            dateTimeStr: newReadingDateTime.trim() || undefined,
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setShowAddReadingModal(false);
        setNewReadingVal("");
        setNewReadingDateTime("");
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

  // Export current journal expenses to CSV
  const handleExportExpensesCSV = () => {
    const list = filteredExpenses;
    if (list.length === 0) return;

    const headers = ["Date", "Item Description", "Category", "Debit (Expense)", "Credit (Income)", "Balance", "Notes"];
    const rows = list.map((e) => [
      `"${(e.dateStr || "").replace(/"/g, '""')}"`,
      `"${(e.item || "").replace(/"/g, '""')}"`,
      `"${(e.category || "").replace(/"/g, '""')}"`,
      e.amount || 0,
      e.income || 0,
      e.balance || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeJournal.key}-expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Active journal category spending breakdown & percentages
  const activeJournalCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    (activeJournal.expenses || []).forEach((e) => {
      if (e.amount && e.amount > 0) {
        const cat = e.category || "General";
        map[cat] = (map[cat] || 0) + e.amount;
        total += e.amount;
      }
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
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

  // Dynamic latest EB reading and timestamp from readings data or metadata
  const latestEbReadingItem = useMemo(() => {
    if (!data.ebReadings || data.ebReadings.length === 0) return null;
    return [...data.ebReadings].sort((a, b) => {
      if (b.meterReading !== a.meterReading) return b.meterReading - a.meterReading;
      const tA = new Date(a.dateTimeStr).getTime();
      const tB = new Date(b.dateTimeStr).getTime();
      if (!isNaN(tA) && !isNaN(tB)) return tB - tA;
      return 0;
    })[0];
  }, [data.ebReadings]);

  const displayLatestReading = latestEbReadingItem ? latestEbReadingItem.meterReading : data.ebMeta.latestReading;
  const displayLatestReadingDate = latestEbReadingItem?.dateTimeStr || data.ebMeta.latestReadingDate || "";

  // Dynamic running billing cycle metrics
  const runningEbCycle = useMemo(() => {
    return (
      data.ebCycles.find((c) => c.status === "Running" || c.cycle.toLowerCase() === "nov") ||
      data.ebCycles[data.ebCycles.length - 1]
    );
  }, [data.ebCycles]);

  // EB Smart Insights: daily burn rate, forecast, and roommate division
  const ebInsights = useMemo(() => {
    const cycle = runningEbCycle;
    const unitsUsed = cycle?.unitsUsed ?? 0;
    const rate = data.ebMeta.currentRate || 10;
    const people = cycle?.peopleSharing || 2;

    const now = new Date();
    const daysElapsed = Math.max(1, now.getDate());
    const burnRate = Number((unitsUsed / daysElapsed).toFixed(2));
    const projectedUnits = Math.max(unitsUsed, Math.round(burnRate * 30));
    const projectedTotal = projectedUnits * rate;
    const projectedShare = Math.round(projectedTotal / people);
    const projectedEndMeter = displayLatestReading + Math.max(0, projectedUnits - unitsUsed);

    return {
      daysElapsed,
      burnRate,
      projectedUnits,
      projectedTotal,
      projectedShare,
      projectedEndMeter,
    };
  }, [runningEbCycle, data.ebMeta.currentRate, displayLatestReading]);

  // Active placement applications (not rejected)
  const activeApplications = useMemo(() => {
    return (data.jobApplications || []).filter(
      (j) => !j.status.toLowerCase().includes("reject") && !j.status.toLowerCase().includes("not attend")
    );
  }, [data.jobApplications]);

  // Unique placement statuses and sources
  const placementStatuses = useMemo(() => {
    const set = new Set<string>();
    (data.jobApplications || []).forEach((j) => {
      if (j.status) set.add(j.status);
    });
    return Array.from(set);
  }, [data.jobApplications]);

  const placementSources = useMemo(() => {
    const set = new Set<string>();
    (data.jobApplications || []).forEach((j) => {
      if (j.source) set.add(j.source);
    });
    return Array.from(set);
  }, [data.jobApplications]);

  // Placement applications filtered
  const filteredPlacements = useMemo(() => {
    return data.jobApplications.filter((job) => {
      const matchSearch =
        job.company.toLowerCase().includes(placementSearch.toLowerCase()) ||
        job.role.toLowerCase().includes(placementSearch.toLowerCase()) ||
        job.location.toLowerCase().includes(placementSearch.toLowerCase());
      if (!matchSearch) return false;

      if (placementStatusFilter !== "all") {
        if (placementStatusFilter === "active") {
          if (job.status.toLowerCase().includes("reject") || job.status.toLowerCase().includes("not attend")) {
            return false;
          }
        } else if (job.status.toLowerCase() !== placementStatusFilter.toLowerCase()) {
          return false;
        }
      }

      if (placementSourceFilter !== "all") {
        if (job.source.toLowerCase() !== placementSourceFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [data.jobApplications, placementSearch, placementStatusFilter, placementSourceFilter]);

  // Antigravity Tokens filtered & sorted
  const filteredTokens = useMemo(() => {
    const list = data.antigravityTokens || [];
    return list
      .filter((t) => {
        const matchesSearch =
          t.email.toLowerCase().includes(tokenSearch.toLowerCase()) ||
          t.chromeProfile.toLowerCase().includes(tokenSearch.toLowerCase());
        if (!matchesSearch) return false;

        if (tokenStatusFilter === "available" && !t.isAvailable) return false;
        if (tokenStatusFilter === "cooldown" && t.isAvailable) return false;

        if (tokenProfileFilter !== "all" && t.chromeProfile.toLowerCase() !== tokenProfileFilter.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (tokenSort === "cooldown-first") {
          if (a.isAvailable !== b.isAvailable) return a.isAvailable ? 1 : -1;
          return a.daysLeft - b.daysLeft;
        }
        if (tokenSort === "available-first") {
          if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
          return a.daysLeft - b.daysLeft;
        }
        if (tokenSort === "days-asc") {
          return a.daysLeft - b.daysLeft;
        }
        return a.email.localeCompare(b.email);
      });
  }, [data.antigravityTokens, tokenSearch, tokenStatusFilter, tokenProfileFilter, tokenSort]);

  // Unique Chrome Profiles for tokens filter
  const tokenProfiles = useMemo(() => {
    const set = new Set<string>();
    (data.antigravityTokens || []).forEach((t) => {
      if (t.chromeProfile) set.add(t.chromeProfile);
    });
    return Array.from(set).sort();
  }, [data.antigravityTokens]);

  // Total purchases value
  const totalPurchaseValue = useMemo(() => {
    return data.purchases.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [data.purchases]);

  // Top placement source computed dynamically
  const topPlacementSource = useMemo(() => {
    if (!data.jobApplications || data.jobApplications.length === 0) return "Superset";
    const counts: Record<string, number> = {};
    data.jobApplications.forEach((j) => {
      const src = j.source || "Superset";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Superset";
  }, [data.jobApplications]);

  // Latest placement action computed dynamically
  const latestPlacementAction = useMemo(() => {
    const active = data.jobApplications.find((j) => j.nextAction || j.interviewStage || j.status);
    return active?.nextAction || active?.interviewStage || active?.status || "In Process";
  }, [data.jobApplications]);

  // Primary ecosystem / brand in purchases
  const primaryBrand = useMemo(() => {
    if (!data.purchases || data.purchases.length === 0) return "Apple";
    const counts: Record<string, number> = {};
    data.purchases.forEach((p) => {
      const b = p.brand || "Other";
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Apple";
  }, [data.purchases]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header & Sync Controls ─── */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[20px] font-bold text-ink tracking-tight">Trackers Hub</h2>
            <span
              title={`Live background auto-sync active (every ${autoSyncIntervalSec}s + on tab switch)`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[10.5px] font-bold text-[#047857]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Live Auto-Sync {autoSyncIntervalSec > 0 ? `(${autoSyncIntervalSec}s)` : "Active"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Personal ledger, PG electricity, tokens, career & life metrics synced live from Google Sheets · Last synced: {lastSyncStr}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Auto-Sync interval selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink shadow-xs">
            <span className="text-muted text-[10.5px]">Auto:</span>
            <select
              value={autoSyncIntervalSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAutoSyncIntervalSec(val);
                setAutoSyncEnabled(val > 0);
              }}
              className="bg-transparent font-semibold text-forest focus:outline-none cursor-pointer"
            >
              <option value="15">15s (Fast)</option>
              <option value="30">30s (Default)</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
              <option value="0">Off (Manual)</option>
            </select>
          </div>

          <a
            href={data.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-medium text-ink hover:bg-[#f8f9f5] transition shadow-xs"
          >
            <ExternalLink size={13} className="text-muted" /> Open Sheet
          </a>

          <button
            onClick={() => handleSync(true, false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-3.5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync Now"}
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
          { key: "eb", label: "PG Electricity (EB)", icon: Zap, count: `${displayLatestReading} units` },
          { key: "expenses", label: "Expense & Budget", icon: Wallet, count: `₹${data.totalMonthlyBudget.toLocaleString()}` },
          {
            key: "tokens",
            label: "Antigravity Tokens",
            icon: Key,
            count: `${data.antigravityTokenSummary?.available ?? (data.antigravityTokens || []).filter((t) => t.isAvailable).length} ready`,
          },
          {
            key: "investments",
            label: "Investment Journal",
            icon: TrendingUp,
            count: data.investments?.grandTotal
              ? `₹${(data.investments.grandTotal / 100000).toFixed(2)}L`
              : (data.investments?.grandTotalFormatted || "₹0"),
          },
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
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">{displayLatestReading} <span className="text-[13px] font-normal text-muted">units</span></p>
              {displayLatestReadingDate ? (
                <p className="mt-1 text-[10.5px] text-[#059669] flex items-center gap-1 font-medium">
                  <Clock size={11} /> {displayLatestReadingDate}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Current Rate</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">₹{data.ebMeta.currentRate} <span className="text-[13px] font-normal text-muted">/ unit</span></p>
              <p className="mt-1 text-[10.5px] text-muted">Was ₹{data.ebMeta.rateTillSep}/unit till Sep</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{runningEbCycle?.cycle || "Nov"} Running Cycle</span>
              <p className="mt-1 text-[22px] font-bold text-[#b45309] tracking-tight">
                {runningEbCycle?.unitsUsed ?? 0} <span className="text-[13px] font-normal text-muted">units</span>
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Cost ₹{runningEbCycle?.computedCost ?? 0} · {runningEbCycle?.peopleSharing ? `${Math.round(100 / runningEbCycle.peopleSharing)}% split` : "50% split"}</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">My Share (Running)</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">₹{runningEbCycle?.myShare ?? 0}</p>
              <p className="mt-1 text-[10.5px] text-muted">{runningEbCycle?.peopleSharing || 2} People Sharing</p>
            </div>
          </div>

          {/* Smart EB Consumption & 30-Day Forecast */}
          <div className="rounded-2xl border border-line bg-linear-to-br from-[#fafbf7] to-white p-4 sm:p-5 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#ecfdf5] text-[#047857]">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-ink">Smart Consumption Insights & 30-Day Forecast</h4>
                  <p className="text-[11px] text-muted">Daily burn velocity and projected month-end settlement</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f2eb] px-2.5 py-1 text-[10.5px] font-semibold text-ink">
                50/50 Roommate Division
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
              <div>
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Daily Burn Rate</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink tracking-tight">
                  {ebInsights.burnRate} <span className="text-[12px] font-normal text-muted">units/day</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">Over past {ebInsights.daysElapsed} days of active readings</p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Projected 30d Units</span>
                <p className="mt-1 text-[20px] font-extrabold text-[#b45309] tracking-tight">
                  ~{ebInsights.projectedUnits} <span className="text-[12px] font-normal text-muted">units</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">Projected final meter reading: ~{ebInsights.projectedEndMeter}</p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Projected Total Bill</span>
                <p className="mt-1 text-[20px] font-extrabold text-ink tracking-tight">
                  ₹{ebInsights.projectedTotal}
                </p>
                <p className="text-[10px] text-muted mt-0.5">At ₹{data.ebMeta.currentRate}/unit for full room</p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Projected My Share</span>
                <p className="mt-1 text-[20px] font-extrabold text-forest tracking-tight">
                  ₹{ebInsights.projectedShare}
                </p>
                <p className="text-[10px] text-[#059669] font-medium mt-0.5">Roommate share: ₹{ebInsights.projectedTotal - ebInsights.projectedShare}</p>
              </div>
            </div>
          </div>

          {/* Billing Cycles Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Billing Cycles History</h3>
              <span className="text-[11px] text-muted">50/50 split with roommate</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {sortedEbCycles.map((cyc) => (
                <div key={cyc.cycle} className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-[#f0f2eb] px-2.5 py-1 text-[12px] font-bold text-ink">
                        {cyc.cycle} Cycle
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                          cyc.status === "Paid"
                            ? "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                            : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                        }`}
                      >
                        {cyc.status}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11.5px] text-muted">Units Consumed</span>
                        <span className="text-[13px] font-bold text-ink">{cyc.unitsUsed} units</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11.5px] text-muted">Total Billed</span>
                        <span className="text-[13px] font-semibold text-ink">₹{cyc.billedAmount ?? cyc.computedCost}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-2.5 mt-2 border-t border-line/70">
                        <span className="text-[12px] font-bold text-forest">My Share (Paid)</span>
                        <span className="text-[14px] font-extrabold text-forest">₹{cyc.myShare}</span>
                      </div>
                    </div>
                  </div>

                  {cyc.notes && (
                    <div className="mt-3.5 rounded-xl border border-line/70 bg-[#fafbf7] px-3.5 py-2.5">
                      <p className="text-[11px] leading-relaxed text-muted line-clamp-3" title={cyc.notes}>
                        {cyc.notes}
                      </p>
                    </div>
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
                  onClick={openAddReadingModal}
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

          {/* Monthly Budget Burn-down Bar & Category Distribution */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Monthly Budget Burn-down</h3>
                <p className="text-[11px] text-muted">
                  Spend velocity vs planned limit of ₹{(data.totalMonthlyBudget || 7500).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                    (totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) > 0.9
                      ? "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                      : (totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) > 0.7
                      ? "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                      : "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                  }`}
                >
                  {Math.round((totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) * 100)}% utilized
                </span>
                <span className="text-[12px] font-semibold text-ink">
                  ₹{Math.max(0, (data.totalMonthlyBudget || 7500) - totalActiveJournalExpense).toLocaleString()} left
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-[#f0f2eb] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) > 0.9
                      ? "bg-[#ef4444]"
                      : (totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) > 0.7
                      ? "bg-[#f59e0b]"
                      : "bg-[#10b981]"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(4, Math.round((totalActiveJournalExpense / (data.totalMonthlyBudget || 7500)) * 100)))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10.5px] text-muted font-medium">
                <span>₹0</span>
                <span>₹{((data.totalMonthlyBudget || 7500) * 0.5).toLocaleString()} (50%)</span>
                <span>Limit: ₹{(data.totalMonthlyBudget || 7500).toLocaleString()}</span>
              </div>
            </div>

            {/* Category Distribution Pills */}
            {activeJournalCategoryBreakdown.length > 0 && (
              <div className="pt-2 border-t border-line/60">
                <span className="text-[11px] font-semibold text-muted block mb-2">Top Spending Categories in this Journal:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeJournalCategoryBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-[#fafbf7] px-3 py-1 text-[11px]"
                    >
                      <span className="font-semibold text-ink">{item.category}</span>
                      <span className="font-bold text-forest">₹{item.amount.toLocaleString()}</span>
                      <span className="rounded-full bg-[#f0f2eb] px-1.5 py-0.2 text-[9px] font-bold text-[#556056]">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

                <button
                  onClick={handleExportExpensesCSV}
                  title="Export currently filtered expenses to CSV file"
                  className="inline-flex items-center gap-1.5 h-8 rounded-xl border border-line bg-white px-3 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-xs cursor-pointer"
                >
                  <Download size={12} className="text-muted" />
                  <span>Export CSV</span>
                </button>
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
                {data.investments.grandTotalFormatted || `₹${(data.investments.grandTotal || 0).toLocaleString("en-IN")}`}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Pre-School through University Degree</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">University (B.Tech)</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                ₹{(data.investments.universityTotal ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">4 Years Fees, Hostel & Exams</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Schooling (K-12)</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                ₹{(data.investments.schoolTotal ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Pre-K through 12th Grade</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Merit Scholarship</span>
              <p className="mt-1 text-[22px] font-bold text-[#059669] tracking-tight">
                ₹{(data.investments.scholarshipEarned ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Tuition Waiver & Benefits</p>
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
                Grand Total: {data.investments.grandTotalFormatted || `₹${(data.investments.grandTotal || 0).toLocaleString("en-IN")}`}
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
                  Deposit: ₹{(data.investments.depositFee ?? 0).toLocaleString("en-IN")}
                </span>
                <span className="rounded-lg bg-[#f0f2eb] px-2.5 py-1 text-[11px] font-semibold text-[#475248]">
                  Alumni: ₹{(data.investments.alumniFee ?? 0).toLocaleString("en-IN")}
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
          TAB: ANTIGRAVITY TOKEN EXPIRY & COOLDOWN TRACKER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "tokens" && (
        <div className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">Total Accounts</span>
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">
                {data.antigravityTokenSummary?.total ?? (data.antigravityTokens?.length || 0)}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Across {tokenProfiles.length} Chrome profiles</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">Ready to Use</span>
              <p className="mt-1 text-[22px] font-bold text-[#059669] tracking-tight flex items-center gap-1.5">
                <CheckCircle2 size={18} className="text-[#059669]" />
                {data.antigravityTokenSummary?.available ?? 0}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Cooldown complete · Active</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">In Cooldown</span>
              <p className="mt-1 text-[22px] font-bold text-[#b45309] tracking-tight flex items-center gap-1.5">
                <Clock size={18} className="text-[#b45309]" />
                {data.antigravityTokenSummary?.inCooldown ?? 0}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">7-day cooldown cycle</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">Next Unlock Batch</span>
              <p className="mt-1 text-[18px] sm:text-[20px] font-bold text-forest tracking-tight">
                {data.antigravityTokenSummary?.nextAvailableDate || "All Available"}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">
                {(data.antigravityTokenSummary?.inCooldown ?? 0) > 0
                  ? `${data.antigravityTokenSummary?.inCooldown} accounts unlocking`
                  : "All accounts ready to use"}
              </p>
            </div>
          </div>

          {/* Chrome Profiles Quick Filter Chips & Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted mr-1">Profiles:</span>
              <button
                onClick={() => setTokenProfileFilter("all")}
                className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition ${
                  tokenProfileFilter === "all"
                    ? "bg-forest text-white shadow-xs"
                    : "bg-white border border-line text-muted hover:bg-[#f1f3ed] hover:text-ink"
                }`}
              >
                All Profiles ({data.antigravityTokens?.length || 0})
              </button>
              {tokenProfiles.map((prof) => {
                const totalInProf = (data.antigravityTokens || []).filter((t) => t.chromeProfile === prof);
                const readyInProf = totalInProf.filter((t) => t.isAvailable).length;
                return (
                  <button
                    key={prof}
                    onClick={() => setTokenProfileFilter(prof)}
                    className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition flex items-center gap-1.5 ${
                      tokenProfileFilter === prof
                        ? "bg-forest text-white shadow-xs"
                        : "bg-white border border-line text-muted hover:bg-[#f1f3ed] hover:text-ink"
                    }`}
                  >
                    <span>{prof}</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full ${
                        tokenProfileFilter === prof
                          ? "bg-white/20 text-white"
                          : readyInProf > 0
                          ? "bg-[#ecfdf5] text-[#047857]"
                          : "bg-[#fffbeb] text-[#b45309]"
                      }`}
                    >
                      {readyInProf}/{totalInProf.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Batch Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCopyNextReady}
                title="Instantly copy the next available token email"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1.5 text-[11.5px] font-bold text-[#047857] hover:bg-[#d1fae5] transition shadow-xs cursor-pointer"
              >
                <Zap size={13} className="text-[#047857]" />
                <span>Copy Next Ready</span>
              </button>

              <button
                onClick={handleCopyAllReady}
                title="Copy all available ready emails (newline-separated)"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink hover:bg-[#f8f9f5] transition shadow-xs cursor-pointer"
              >
                <Copy size={12} className="text-muted" />
                <span>Copy All Ready ({data.antigravityTokenSummary?.available ?? 0})</span>
              </button>
            </div>
          </div>

          {tokenBatchCopied && (
            <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-3.5 py-2 text-[12px] font-semibold text-[#047857] flex items-center gap-2 animate-in fade-in">
              <Check size={14} />
              <span>{tokenBatchCopied}</span>
            </div>
          )}

          {/* Search, Status & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search email or profile..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="w-full h-9 rounded-xl border border-line bg-white pl-9 pr-3 text-[12px] text-ink placeholder:text-muted/60 focus:border-forest focus:outline-none shadow-xs"
              />
              {tokenSearch && (
                <button
                  onClick={() => setTokenSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white border border-line rounded-xl p-1 text-[11px]">
                <button
                  onClick={() => setTokenStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    tokenStatusFilter === "all" ? "bg-forest text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  All ({data.antigravityTokens?.length || 0})
                </button>
                <button
                  onClick={() => setTokenStatusFilter("available")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    tokenStatusFilter === "available" ? "bg-[#ecfdf5] text-[#047857]" : "text-muted hover:text-ink"
                  }`}
                >
                  Ready ({data.antigravityTokenSummary?.available ?? 0})
                </button>
                <button
                  onClick={() => setTokenStatusFilter("cooldown")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    tokenStatusFilter === "cooldown" ? "bg-[#fffbeb] text-[#b45309]" : "text-muted hover:text-ink"
                  }`}
                >
                  Cooldown ({data.antigravityTokenSummary?.inCooldown ?? 0})
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={tokenSort}
                onChange={(e) => setTokenSort(e.target.value as any)}
                className="h-9 rounded-xl border border-line bg-white px-3 text-[11px] font-semibold text-ink focus:border-forest focus:outline-none"
              >
                <option value="cooldown-first">In Cooldown First</option>
                <option value="available-first">Ready / Available First</option>
                <option value="days-asc">Least Days Left</option>
                <option value="email">Email (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Tokens Table */}
          <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
            <div className="p-4 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fbfcf8]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-ink">Antigravity Token Expiry Ledger</h4>
                  <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[9.5px] font-bold text-[#047857]">
                    Google Cooldown Tracker
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Showing {filteredTokens.length} of {data.antigravityTokens?.length || 0} accounts
                </p>
              </div>

              {copiedEmail && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-1 text-[11px] font-semibold text-[#047857] animate-in fade-in">
                  <Check size={12} /> Copied {copiedEmail} to clipboard
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-[#fafbf7] text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-4">Email Account</th>
                    <th className="py-2.5 px-4">Chrome Profile</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Days Left</th>
                    <th className="py-2.5 px-4 text-right">Last Used</th>
                    <th className="py-2.5 px-4 text-right">Cooldown</th>
                    <th className="py-2.5 px-4 text-right">Available Again</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2eb]">
                  {filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        No accounts match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-[#fafbf7] transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{t.email}</span>
                            <button
                              onClick={() => handleCopyEmail(t.email)}
                              title={copiedEmail === t.email ? "Copied to clipboard!" : "Copy email"}
                              className={`inline-flex items-center gap-1 transition px-1.5 py-0.5 rounded-md text-[11px] font-medium cursor-pointer ${
                                copiedEmail === t.email
                                  ? "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] shadow-2xs"
                                  : "text-muted/60 hover:text-ink hover:bg-[#eff1eb]"
                              }`}
                            >
                              {copiedEmail === t.email ? (
                                <>
                                  <Check size={11} className="text-[#047857]" />
                                  <span className="text-[10px] font-bold text-[#047857]">Copied!</span>
                                </>
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-lg bg-[#f0f2eb] px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                            {t.chromeProfile}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                              t.isAvailable
                                ? "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                                : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                            }`}
                          >
                            {t.isAvailable ? (
                              <>
                                <Check size={11} /> Ready
                              </>
                            ) : (
                              <>
                                <Clock size={11} /> {t.daysLeft}d cooldown
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {t.isAvailable ? (
                            <span className="text-[11px] font-bold text-[#059669]">0 days</span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-[12px] font-extrabold text-[#b45309]">{t.daysLeft} day</span>
                              <div className="w-12 h-1.5 bg-[#f0f2eb] rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-[#f59e0b] rounded-full"
                                  style={{ width: `${Math.max(10, ((7 - t.daysLeft) / 7) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right text-muted text-[11.5px] font-mono">
                          {t.lastUsed || "—"}
                        </td>

                        <td className="py-3 px-4 text-right text-muted text-[11.5px]">
                          {t.cooldownDays} days
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-[12px] font-semibold ${
                              t.isAvailable ? "text-ink" : "text-[#b45309] font-bold"
                            }`}
                          >
                            {t.availableAgain || "Available"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight truncate">{topPlacementSource}</p>
              <p className="mt-1 text-[10.5px] text-muted">Most frequent application channel</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Latest Action</span>
              <p className="mt-1 text-[16px] font-bold text-forest tracking-tight truncate">{latestPlacementAction}</p>
              <p className="mt-1 text-[10.5px] text-muted">Current candidate status</p>
            </div>
          </div>

          {/* Active Pipelines & Action Items Card */}
          {activeApplications.length > 0 && (
            <div className="rounded-2xl border border-line bg-linear-to-br from-[#fafbf7] to-white p-4 sm:p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857]">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-ink">Active Career Pipelines & Next Actions</h4>
                    <p className="text-[11px] text-muted">{activeApplications.length} active applications progressing</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[10.5px] font-bold text-[#047857]">
                  Awaiting OA / Next Round
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeApplications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-line/70 bg-white p-3 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[13px] text-ink truncate">{app.company}</span>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#1d4ed8]">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">{app.role}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#f0f2eb] flex items-center justify-between text-[10px] text-muted">
                      <span className="font-medium text-forest">{app.source}</span>
                      <span>Applied: {app.appliedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search, Status & Source Filter Header */}
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
              {placementSearch && (
                <button
                  onClick={() => setPlacementSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Status Chips */}
              <div className="flex items-center gap-1 bg-white border border-line rounded-xl p-1 text-[11px] overflow-x-auto max-w-full">
                <button
                  onClick={() => setPlacementStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                    placementStatusFilter === "all" ? "bg-forest text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  All ({data.jobApplications.length})
                </button>
                <button
                  onClick={() => setPlacementStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                    placementStatusFilter === "active" ? "bg-[#ecfdf5] text-[#047857]" : "text-muted hover:text-ink"
                  }`}
                >
                  Active ({activeApplications.length})
                </button>
                {placementStatuses.map((st) => {
                  const count = data.jobApplications.filter((j) => j.status === st).length;
                  return (
                    <button
                      key={st}
                      onClick={() => setPlacementStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                        placementStatusFilter === st ? "bg-forest text-white" : "text-muted hover:text-ink"
                      }`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Source Dropdown */}
              {placementSources.length > 1 && (
                <select
                  value={placementSourceFilter}
                  onChange={(e) => setPlacementSourceFilter(e.target.value)}
                  className="h-9 rounded-xl border border-line bg-white px-2.5 text-[11px] font-semibold text-ink focus:border-forest focus:outline-none shadow-xs"
                >
                  <option value="all">All Sources</option>
                  {placementSources.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              )}
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
              { label: "Next Milestone", val: `${(data.lifeStats.ageYears || 21) + 1} Years` },
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
              <p className="mt-1 text-[22px] font-bold text-ink tracking-tight">{primaryBrand}</p>
              <p className="mt-1 text-[10.5px] text-muted">Most logged device brand</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Registered Assets</span>
              <p className="mt-1 text-[22px] font-bold text-forest tracking-tight">
                {data.purchases.filter((p) => p.deliveryDate).length} / {data.purchases.length}
              </p>
              <p className="mt-1 text-[10.5px] text-muted">Delivered & verified</p>
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
                <label className="text-[11px] font-semibold text-muted block mb-1">Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. 07 Nov 2026, 9:40 AM"
                  value={newReadingDateTime}
                  onChange={(e) => setNewReadingDateTime(e.target.value)}
                  className="w-full h-9 rounded-xl border border-line px-3 text-[12px] text-ink focus:border-forest focus:outline-none"
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
