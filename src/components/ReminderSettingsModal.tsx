import React, { useState } from "react";
import {
  X,
  Bell,
  Volume2,
  Clock,
  Check,
  Sparkles,
  Play,
  ShieldCheck,
} from "lucide-react";
import { ReminderConfig } from "../types";
import { playReminderChime } from "../utils/sound";
import {
  isNotificationSupported,
  requestNotificationPermission,
} from "../utils/notifications";

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReminderConfig;
  onSaveConfig: (updated: ReminderConfig) => void;
  onTestReminder: () => void;
}

const INTERVAL_OPTIONS = [
  { minutes: 30, label: "30 min", description: "Frequent sips" },
  { minutes: 45, label: "45 min", description: "Recommended" },
  { minutes: 60, label: "1 hour", description: "Balanced" },
  { minutes: 90, label: "1.5 hours", description: "Moderate" },
  { minutes: 120, label: "2 hours", description: "Relaxed" },
];

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestReminder,
}) => {
  const [localConfig, setLocalConfig] = useState<ReminderConfig>({ ...config });
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(
      typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
    );

  if (!isOpen) return null;

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      setNotificationPermissionGranted(granted);
      setLocalConfig((prev) => ({
        ...prev,
        browserNotificationsEnabled: granted,
      }));
    } else {
      setLocalConfig((prev) => ({
        ...prev,
        browserNotificationsEnabled: false,
      }));
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div
      id="reminder-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-sky-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <Bell className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hydration Reminders
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Main Master Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
                Enable Daily Reminders
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Receive timely prompts to stay hydrated
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
            </label>
          </div>

          {/* Interval Frequency */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Reminder Interval
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      intervalMinutes: opt.minutes,
                    }))
                  }
                  className={`p-2 rounded-xl text-center border transition-all ${
                    localConfig.intervalMinutes === opt.minutes
                      ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Hours */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Active Hours (Quiet Sleep Window)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 block mb-1">
                  Start Reminders At
                </span>
                <select
                  value={localConfig.startHour}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startHour: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0
                        ? "12:00 AM"
                        : i < 12
                        ? `${i}:00 AM`
                        : i === 12
                        ? "12:00 PM"
                        : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">
                  Stop Reminders At
                </span>
                <select
                  value={localConfig.endHour}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      endHour: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0
                        ? "12:00 AM"
                        : i < 12
                        ? `${i}:00 AM`
                        : i === 12
                        ? "12:00 PM"
                        : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sound & Notifications Toggles */}
          <div className="space-y-3 pt-1">
            {/* Audio chime */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Water Droplet Sound
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Gentle synthesized chime
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={playReminderChime}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1 transition-colors"
                  title="Test Chime"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test</span>
                </button>
                <input
                  type="checkbox"
                  checked={localConfig.soundEnabled}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      soundEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Browser notification */}
            {isNotificationSupported() && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Browser Desktop Notifications
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {notificationPermissionGranted
                        ? "Permission active"
                        : "Click to permit in browser"}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.browserNotificationsEnabled}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          {/* Test reminder now button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onTestReminder();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Preview Reminder Alert Now</span>
            </button>
          </div>

          {/* Save Action */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Save Reminder Settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
