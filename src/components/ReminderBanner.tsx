import React from "react";
import {
  Bell,
  Clock,
  Droplet,
  Sparkles,
  Volume2,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { HydrationCoachAdvice, ReminderConfig, UnitMode, formatVolume } from "../types";

interface ReminderBannerProps {
  config: ReminderConfig;
  nextReminderRemainingSeconds: number | null;
  isReminderDue: boolean;
  coachAdvice: HydrationCoachAdvice | null;
  isLoadingCoach: boolean;
  onRefreshCoach: () => void;
  onDrinkNow: (amountMl: number) => void;
  onSnooze: (minutes: number) => void;
  onDismissReminder: () => void;
  onOpenSettings: () => void;
  unit: UnitMode;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  config,
  nextReminderRemainingSeconds,
  isReminderDue,
  coachAdvice,
  isLoadingCoach,
  onRefreshCoach,
  onDrinkNow,
  onSnooze,
  onDismissReminder,
  onOpenSettings,
  unit,
}) => {
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Active Hydration Due Alert Box */}
      {isReminderDue && (
        <div
          id="hydration-due-alert"
          className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 border border-sky-300/40 animate-bounce-short"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                <Bell className="w-5 h-5 animate-wiggle" />
              </span>
              <div>
                <h4 className="text-base font-bold tracking-tight">
                  Hydration Reminder 💧
                </h4>
                <p className="text-xs text-sky-100 mt-0.5 max-w-md">
                  {coachAdvice?.reminderMessage ||
                    "Time for a quick refresh! Even small sips keep your focus sharp."}
                </p>
              </div>
            </div>

            <button
              onClick={onDismissReminder}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              id="drink-now-from-reminder"
              onClick={() =>
                onDrinkNow(coachAdvice?.suggestedNextIntakeMl || 250)
              }
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <Droplet className="w-3.5 h-3.5 fill-current" />
              <span>
                Drink {formatVolume(coachAdvice?.suggestedNextIntakeMl || 250, unit)} Now
              </span>
            </button>

            <button
              onClick={() => onSnooze(10)}
              className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs backdrop-blur-sm transition-all"
            >
              Snooze 10m
            </button>

            <button
              onClick={() => onSnooze(30)}
              className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs backdrop-blur-sm transition-all"
            >
              Snooze 30m
            </button>
          </div>
        </div>
      )}

      {/* Reminder Schedule Bar & Gemini Hydration Coach Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Hydration Reminders
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    config.enabled
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {config.enabled ? `Every ${config.intervalMinutes}m` : "Paused"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Active between {config.startHour}:00 and {config.endHour}:00
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {config.enabled && nextReminderRemainingSeconds !== null && (
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/50">
                Next in {formatTimeRemaining(nextReminderRemainingSeconds)}
              </span>
            )}
            <button
              id="open-reminder-settings-btn"
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Gemini Intelligence Hydration Insight */}
        <div className="mt-3 flex items-start gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </span>

          <div className="flex-1 text-xs text-slate-600 dark:text-slate-300">
            {isLoadingCoach ? (
              <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Consulting Gemini hydration coach...</span>
              </div>
            ) : coachAdvice ? (
              <div className="space-y-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {coachAdvice.statusInsight}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: {coachAdvice.funFact}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">
                Consistent hydration boosts focus, energy, and muscle recovery.
              </p>
            )}
          </div>

          <button
            onClick={onRefreshCoach}
            disabled={isLoadingCoach}
            title="Refresh coach advice with Gemini"
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingCoach ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
