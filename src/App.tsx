import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Droplets,
  Mic,
  Settings,
  Bell,
  Sparkles,
  RotateCcw,
  Target,
  Sun,
  Moon,
  Volume2,
} from "lucide-react";
import {
  BeverageType,
  DayHistory,
  HydrationCoachAdvice,
  ReminderConfig,
  UnitMode,
  WaterEntry,
} from "./types";
import { WaterWaveGauge } from "./components/WaterWaveGauge";
import { QuickLogBar } from "./components/QuickLogBar";
import { ReminderBanner } from "./components/ReminderBanner";
import { ReminderSettingsModal } from "./components/ReminderSettingsModal";
import { VoiceLoggerModal } from "./components/VoiceLoggerModal";
import { IntakeHistoryList } from "./components/IntakeHistoryList";
import { GoalCalculatorModal } from "./components/GoalCalculatorModal";
import { playReminderChime, playWaterDropSound } from "./utils/sound";
import { sendBrowserNotification } from "./utils/notifications";

const DEFAULT_GOAL_ML = 2500;

const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  intervalMinutes: 45,
  startHour: 8,
  endHour: 22,
  soundEnabled: true,
  browserNotificationsEnabled: false,
  lastRemindedAt: null,
  snoozedUntil: null,
};

export default function App() {
  const getTodayDateStr = () => new Date().toISOString().split("T")[0];
  const [todayStr, setTodayStr] = useState<string>(getTodayDateStr());

  // State
  const [goalMl, setGoalMl] = useState<number>(() => {
    const saved = localStorage.getItem("hydro_daily_goal");
    return saved ? Number(saved) : DEFAULT_GOAL_ML;
  });

  const [unit, setUnit] = useState<UnitMode>(() => {
    return (localStorage.getItem("hydro_unit") as UnitMode) || "ml";
  });

  const [entries, setEntries] = useState<WaterEntry[]>(() => {
    const saved = localStorage.getItem(`hydro_entries_${getTodayDateStr()}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [pastWeek, setPastWeek] = useState<DayHistory[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);

  // Reminder State
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(() => {
    const saved = localStorage.getItem("hydro_reminder_config");
    return saved ? { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(saved) } : DEFAULT_REMINDER_CONFIG;
  });

  const [isReminderDue, setIsReminderDue] = useState<boolean>(false);
  const [nextReminderRemainingSeconds, setNextReminderRemainingSeconds] =
    useState<number | null>(null);

  // Gemini Hydration Coach Advice
  const [coachAdvice, setCoachAdvice] = useState<HydrationCoachAdvice | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);

  const prevIntakeRef = useRef<number>(0);

  // Calculate current intake for today
  const currentIntakeMl = entries.reduce((acc, curr) => acc + curr.amountMl, 0);

  // Save entries on change
  useEffect(() => {
    const currentToday = getTodayDateStr();
    localStorage.setItem(`hydro_entries_${currentToday}`, JSON.stringify(entries));
    updatePastWeekAndStreak();
  }, [entries]);

  // Save config on change
  useEffect(() => {
    localStorage.setItem("hydro_reminder_config", JSON.stringify(reminderConfig));
  }, [reminderConfig]);

  // Save goal on change
  useEffect(() => {
    localStorage.setItem("hydro_daily_goal", goalMl.toString());
  }, [goalMl]);

  // Save unit on change
  useEffect(() => {
    localStorage.setItem("hydro_unit", unit);
  }, [unit]);

  // Confetti when goal reached
  useEffect(() => {
    if (
      prevIntakeRef.current < goalMl &&
      currentIntakeMl >= goalMl &&
      currentIntakeMl > 0
    ) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#0284c7", "#34d399", "#10b981"],
        });
      } catch (e) {
        // silent
      }
    }
    prevIntakeRef.current = currentIntakeMl;
  }, [currentIntakeMl, goalMl]);

  // Update 7-day history & streak calculation
  const updatePastWeekAndStreak = useCallback(() => {
    const days: DayHistory[] = [];
    let currentStreak = 0;
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const savedEntriesStr = localStorage.getItem(`hydro_entries_${dateStr}`);
      const dayEntries: WaterEntry[] = savedEntriesStr ? JSON.parse(savedEntriesStr) : [];
      const total = dayEntries.reduce((sum, e) => sum + e.amountMl, 0);

      const dayRecord: DayHistory = {
        date: dateStr,
        totalMl: total,
        goalMl,
        completed: total >= goalMl,
        entriesCount: dayEntries.length,
      };
      days.push(dayRecord);
    }
    setPastWeek(days);

    // Compute streak
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed) {
        currentStreak++;
      } else if (i === days.length - 1) {
        // If today is not completed yet, keep checking yesterday's streak
        continue;
      } else {
        break;
      }
    }
    setStreakDays(currentStreak);
  }, [goalMl]);

  useEffect(() => {
    updatePastWeekAndStreak();
  }, [updatePastWeekAndStreak]);

  // Fetch Gemini Hydration Coach Advice
  const fetchHydrationCoachAdvice = useCallback(async () => {
    setIsLoadingCoach(true);
    try {
      const res = await fetch("/api/hydration-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentIntakeMl,
          dailyGoalMl: goalMl,
          unit,
          reminderIntervalMinutes: reminderConfig.intervalMinutes,
          recentLogs: entries.slice(-4),
          userTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCoachAdvice(data);
      }
    } catch (err) {
      console.warn("Could not fetch hydration coach advice:", err);
    } finally {
      setIsLoadingCoach(false);
    }
  }, [currentIntakeMl, goalMl, unit, reminderConfig.intervalMinutes, entries]);

  useEffect(() => {
    fetchHydrationCoachAdvice();
  }, []);

  // Reminder Timer Engine
  useEffect(() => {
    if (!reminderConfig.enabled) {
      setNextReminderRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const nowMs = now.getTime();

      // Check if current hour is within active reminder window
      const inActiveHours =
        currentHour >= reminderConfig.startHour &&
        currentHour < reminderConfig.endHour;

      if (!inActiveHours) {
        setNextReminderRemainingSeconds(null);
        return;
      }

      // Check if snoozed
      if (reminderConfig.snoozedUntil && nowMs < reminderConfig.snoozedUntil) {
        const remainingSecs = Math.max(
          0,
          Math.floor((reminderConfig.snoozedUntil - nowMs) / 1000)
        );
        setNextReminderRemainingSeconds(remainingSecs);
        return;
      }

      // Calculate next due time
      const intervalMs = reminderConfig.intervalMinutes * 60 * 1000;
      const lastActionTime =
        reminderConfig.lastRemindedAt ||
        (entries.length > 0
          ? new Date(entries[entries.length - 1].timestamp).getTime()
          : nowMs - intervalMs);

      const nextDueMs = lastActionTime + intervalMs;
      const remainingSecs = Math.max(0, Math.floor((nextDueMs - nowMs) / 1000));
      setNextReminderRemainingSeconds(remainingSecs);

      // Trigger reminder if due and not already shown
      if (remainingSecs === 0 && !isReminderDue) {
        setIsReminderDue(true);
        if (reminderConfig.soundEnabled) {
          playReminderChime();
        }
        if (reminderConfig.browserNotificationsEnabled) {
          sendBrowserNotification(
            "Hydration Reminder 💧",
            coachAdvice?.reminderMessage ||
              "Time for a quick drink of water to stay fresh and energized!"
          );
        }
        setReminderConfig((prev) => ({
          ...prev,
          lastRemindedAt: nowMs,
          snoozedUntil: null,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reminderConfig, isReminderDue, entries, coachAdvice]);

  // Log new water entry
  const handleAddIntake = (
    amountMl: number,
    beverage: BeverageType | string = "Water",
    notes?: string,
    isVoice?: boolean
  ) => {
    const newEntry: WaterEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      amountMl,
      beverage,
      notes,
      isVoice,
    };

    setEntries((prev) => [...prev, newEntry]);
    playWaterDropSound();

    // Reset reminder state and update last reminded at
    setIsReminderDue(false);
    setReminderConfig((prev) => ({
      ...prev,
      lastRemindedAt: Date.now(),
      snoozedUntil: null,
    }));
  };

  // Delete water entry
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Clear all today
  const handleResetToday = () => {
    if (window.confirm("Reset all drinks logged for today?")) {
      setEntries([]);
      setIsReminderDue(false);
    }
  };

  // Reminder actions
  const handleDrinkFromReminder = (amountMl: number) => {
    handleAddIntake(amountMl, "Water", "From hydration reminder");
  };

  const handleSnoozeReminder = (minutes: number) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    setIsReminderDue(false);
    setReminderConfig((prev) => ({
      ...prev,
      snoozedUntil: snoozeUntil,
    }));
  };

  const handleDismissReminder = () => {
    setIsReminderDue(false);
    setReminderConfig((prev) => ({
      ...prev,
      lastRemindedAt: Date.now(),
      snoozedUntil: null,
    }));
  };

  const handleTestReminder = () => {
    setIsReminderDue(true);
    if (reminderConfig.soundEnabled) {
      playReminderChime();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-sky-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>HydroTrack</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Daily
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Water Intake & Reminders
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Unit Toggle */}
            <button
              id="unit-toggle-btn"
              onClick={() => setUnit((prev) => (prev === "ml" ? "oz" : "ml"))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Units (ml / oz)"
            >
              {unit.toUpperCase()}
            </button>

            {/* Goal Calculator Button */}
            <button
              id="goal-settings-btn"
              onClick={() => setIsGoalModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Adjust Daily Goal"
              aria-label="Adjust Daily Goal"
            >
              <Target className="w-4 h-4" />
            </button>

            {/* Reminder Settings Button */}
            <button
              id="reminder-config-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Reminder Settings"
              aria-label="Reminder Settings"
            >
              <Bell className="w-4 h-4" />
              {reminderConfig.enabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Active Reminder & Smart Coach Section */}
        <ReminderBanner
          config={reminderConfig}
          nextReminderRemainingSeconds={nextReminderRemainingSeconds}
          isReminderDue={isReminderDue}
          coachAdvice={coachAdvice}
          isLoadingCoach={isLoadingCoach}
          onRefreshCoach={fetchHydrationCoachAdvice}
          onDrinkNow={handleDrinkFromReminder}
          onSnooze={handleSnoozeReminder}
          onDismissReminder={handleDismissReminder}
          onOpenSettings={() => setIsSettingsOpen(true)}
          unit={unit}
        />

        {/* Central Water Intake Visual Wave Gauge */}
        <WaterWaveGauge
          currentMl={currentIntakeMl}
          goalMl={goalMl}
          unit={unit}
          streakDays={streakDays}
          onQuickAdd={(ml) => handleAddIntake(ml)}
        />

        {/* Quick Log Presets & Voice Recorder Trigger */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <QuickLogBar
            unit={unit}
            onQuickAdd={(ml, beverage, notes) =>
              handleAddIntake(ml, beverage, notes)
            }
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          />
        </div>

        {/* Intake History Timeline & 7-Day Consistency Bar Chart */}
        <IntakeHistoryList
          entries={entries}
          pastWeek={pastWeek}
          unit={unit}
          onDeleteEntry={handleDeleteEntry}
          goalMl={goalMl}
        />

        {/* Bottom Utility Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 pb-8">
          <span>
            HydroTrack • Voice powered by{" "}
            <strong className="text-sky-600 dark:text-sky-400">
              gemini-3.5-transcribe
            </strong>
          </span>
          {entries.length > 0 && (
            <button
              onClick={handleResetToday}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Today</span>
            </button>
          )}
        </div>
      </main>

      {/* Voice Logger Modal */}
      <VoiceLoggerModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onLogEntry={(ml, beverage, notes) =>
          handleAddIntake(ml, beverage, notes, true)
        }
        unit={unit}
      />

      {/* Reminder Settings Modal */}
      <ReminderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={reminderConfig}
        onSaveConfig={(updated) => setReminderConfig(updated)}
        onTestReminder={handleTestReminder}
      />

      {/* Daily Goal Calculator Modal */}
      <GoalCalculatorModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoalMl={goalMl}
        onSaveGoal={(newGoal) => setGoalMl(newGoal)}
        unit={unit}
      />
    </div>
  );
}
