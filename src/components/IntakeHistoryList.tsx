import React from "react";
import {
  History,
  Trash2,
  Mic,
  Calendar,
  Sparkles,
  Droplet,
  CheckCircle2,
} from "lucide-react";
import { DayHistory, WaterEntry, UnitMode, formatVolume } from "../types";

interface IntakeHistoryListProps {
  entries: WaterEntry[];
  pastWeek: DayHistory[];
  unit: UnitMode;
  onDeleteEntry: (id: string) => void;
  goalMl: number;
}

export const IntakeHistoryList: React.FC<IntakeHistoryListProps> = ({
  entries,
  pastWeek,
  unit,
  onDeleteEntry,
  goalMl,
}) => {
  const sortedEntries = [...entries].reverse(); // most recent first

  // Helper to format ISO timestamp to "h:mm A"
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getBeverageEmoji = (beverage: string): string => {
    const lower = beverage.toLowerCase();
    if (lower.includes("tea")) return "🍵";
    if (lower.includes("lemon")) return "🍋";
    if (lower.includes("sparkling")) return "🫧";
    if (lower.includes("coffee")) return "☕";
    if (lower.includes("coconut")) return "🥥";
    if (lower.includes("electrolyte")) return "⚡";
    return "💧";
  };

  return (
    <div className="w-full space-y-6">
      {/* 7-Day History Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              7-Day Hydration Consistency
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Goal: {formatVolume(goalMl, unit)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 items-end h-32">
          {pastWeek.map((day) => {
            const heightPercent = Math.min(
              100,
              Math.max(8, Math.round((day.totalMl / (day.goalMl || goalMl)) * 100))
            );
            const isToday =
              day.date === new Date().toISOString().split("T")[0];
            const isCompleted = day.completed || day.totalMl >= goalMl;

            const dayName = new Date(day.date + "T00:00:00").toLocaleDateString(
              [],
              { weekday: "narrow" }
            );

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-md">
                  {formatVolume(day.totalMl, unit)} ({Math.round((day.totalMl / goalMl) * 100)}%)
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-20 flex items-end p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all duration-500 ${
                      isCompleted
                        ? "bg-emerald-400 dark:bg-emerald-500"
                        : isToday
                        ? "bg-sky-400 dark:bg-sky-500"
                        : "bg-sky-300/80 dark:bg-sky-600/70"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-0.5">
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? "text-sky-600 dark:text-sky-400 font-bold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {dayName}
                  </span>
                  {isCompleted && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Logged Entries */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <History className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Today's Drink Log
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Droplet className="w-8 h-8 text-sky-400/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No drinks logged yet today
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
              Tap a quick preset button above or tap Voice Log to record your first drink.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                id={`entry-${entry.id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/40 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-base shadow-2xs">
                    {getBeverageEmoji(entry.beverage)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {entry.beverage}
                      </span>
                      {entry.isVoice && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
                          <Mic className="w-2.5 h-2.5" />
                          <span>Voice</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatTime(entry.timestamp)}</span>
                      {entry.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px] sm:max-w-xs text-slate-500 dark:text-slate-400">
                            {entry.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">
                    +{formatVolume(entry.amountMl, unit)}
                  </span>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-80 group-hover:opacity-100"
                    title="Delete entry"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
