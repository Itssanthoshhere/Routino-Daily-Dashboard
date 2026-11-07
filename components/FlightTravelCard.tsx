"use client";

import { useState, useEffect } from "react";
import {
  Plane,
  Clock3,
  MapPin,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  ExternalLink,
  Luggage,
} from "lucide-react";
import type { DashboardEvent } from "@/types/dashboard";
import { getTodayTravelInfo, TravelInfo } from "@/lib/meeting";

type FlightTravelCardProps = {
  events: DashboardEvent[];
  onViewEvent?: (event: DashboardEvent) => void;
};

const DEFAULT_ESSENTIALS = [
  { id: "pass", label: "Boarding pass & web check-in confirmed" },
  { id: "id", label: "Govt Photo ID / Passport packed" },
  { id: "tech", label: "Laptop, phone & device chargers" },
  { id: "bag", label: "Cabin & check-in baggage under weight limits" },
];

export function FlightTravelCard({ events, onViewEvent }: FlightTravelCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const travelInfo: TravelInfo | null = getTodayTravelInfo(events);

  // Load checklist progress from localStorage
  useEffect(() => {
    if (!travelInfo?.event.id) return;
    try {
      const stored = localStorage.getItem(`routino_travel_prep_${travelInfo.event.id}`);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    } catch {}
  }, [travelInfo?.event.id]);

  const toggleCheck = (id: string) => {
    if (!travelInfo?.event.id) return;
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`routino_travel_prep_${travelInfo.event.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  if (!travelInfo || dismissed) return null;

  const {
    event,
    flightCode,
    airline,
    destination,
    departureTimeStr,
    arrivalTimeStr,
    isDeparted,
    isArrived,
    minutesUntilDeparture,
  } = travelInfo;

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#bae6fd] bg-gradient-to-br from-[#f0f9ff] via-[#f8fafc] to-[#ffffff] p-4 sm:p-5 shadow-sm transition animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#e0f2fe] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0284c7] text-white shadow-xs">
            <Plane size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#e0f2fe] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[#0284c7]">
                Today&apos;s Travel
              </span>
              {flightCode && (
                <span className="rounded-md bg-white border border-[#bae6fd] px-2 py-0.5 text-[10px] font-bold text-[#0369a1]">
                  {airline ? `${airline} · ` : ""}{flightCode}
                </span>
              )}
            </div>
            <h3 className="mt-0.5 text-[14px] font-bold text-ink truncate max-w-sm sm:max-w-md">
              {event.summary || "Scheduled Travel"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge */}
          {isArrived ? (
            <span className="rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-1 text-[11px] font-bold text-[#059669]">
              Arrived ✓
            </span>
          ) : isDeparted ? (
            <span className="rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-1 text-[11px] font-bold text-[#0284c7] flex items-center gap-1">
              <Plane size={12} className="animate-pulse" /> In Transit
            </span>
          ) : minutesUntilDeparture <= 90 && minutesUntilDeparture > 0 ? (
            <span className="rounded-lg bg-[#fff7ed] border border-[#fed7aa] px-2.5 py-1 text-[11px] font-bold text-[#c2410c] flex items-center gap-1">
              <Clock3 size={12} /> Boarding in {minutesUntilDeparture}m
            </span>
          ) : minutesUntilDeparture > 0 ? (
            <span className="rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-1 text-[11px] font-bold text-[#0284c7] flex items-center gap-1">
              <Clock3 size={12} /> Departing in {Math.floor(minutesUntilDeparture / 60)}h {minutesUntilDeparture % 60}m
            </span>
          ) : null}

          <button
            onClick={() => setDismissed(true)}
            title="Dismiss travel card"
            className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Flight Route & Timing Grid */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e0f2fe] bg-white/80 p-3 sm:p-4">
        {/* Origin / Departure */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] font-bold text-[11px] shrink-0">
            DEP
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">Departure</span>
            <span className="text-[17px] font-extrabold text-ink tracking-tight">{departureTimeStr}</span>
          </div>
        </div>

        {/* Visual Route Track */}
        <div className="flex-1 hidden md:flex flex-col items-center px-4">
          <div className="w-full flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0284c7]" />
            <div className="flex-1 border-t-2 border-dashed border-[#bae6fd] relative flex justify-center items-center">
              <span className="absolute bg-white px-2 text-[#0284c7]">
                <Plane size={15} />
              </span>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#0284c7]" />
          </div>
          <span className="mt-1 text-[9.5px] font-semibold text-muted uppercase tracking-widest">
            {destination ? `To ${destination}` : "Direct Flight"}
          </span>
        </div>

        {/* Destination / Arrival */}
        <div className="flex items-center gap-3 sm:text-right sm:flex-row-reverse">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] font-bold text-[11px] shrink-0">
            ARR
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
              {destination ? destination : "Arrival"}
            </span>
            <span className="text-[17px] font-extrabold text-ink tracking-tight">{arrivalTimeStr}</span>
          </div>
        </div>
      </div>

      {/* Interactive Travel Prep Checklist */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowChecklist((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] transition cursor-pointer"
          >
            <Luggage size={13} />
            <span>Travel Essentials Checklist ({completedCount}/{DEFAULT_ESSENTIALS.length})</span>
            {showChecklist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {onViewEvent && (
            <button
              type="button"
              onClick={() => onViewEvent(event)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-ink transition cursor-pointer"
            >
              <span>View Details</span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>

        {showChecklist && (
          <div className="mt-2 space-y-1.5 rounded-xl border border-[#e0f2fe] bg-white p-3 animate-in fade-in duration-200">
            {DEFAULT_ESSENTIALS.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className="flex items-center gap-2.5 w-full text-left py-1 text-[11.5px] group cursor-pointer"
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded border transition ${
                      isChecked
                        ? "border-[#0284c7] bg-[#0284c7] text-white"
                        : "border-[#cbd5e1] text-transparent group-hover:border-[#0284c7]/50"
                    }`}
                  >
                    {isChecked ? <CheckSquare size={11} /> : <Square size={11} />}
                  </span>
                  <span
                    className={`transition ${
                      isChecked ? "text-muted line-through" : "text-ink font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
