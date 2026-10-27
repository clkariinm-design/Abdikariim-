import React, { useState } from "react";
import { X, Target, Calculator, Check, Sparkles } from "lucide-react";
import { formatVolume, UnitMode } from "../types";

interface GoalCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoalMl: number;
  onSaveGoal: (newGoalMl: number) => void;
  unit: UnitMode;
}

export const GoalCalculatorModal: React.FC<GoalCalculatorModalProps> = ({
  isOpen,
  onClose,
  currentGoalMl,
  onSaveGoal,
  unit,
}) => {
  const [goalInput, setGoalInput] = useState<number>(currentGoalMl);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [activity, setActivity] = useState<"light" | "moderate" | "high">(
    "moderate"
  );
  const [climate, setClimate] = useState<"cool" | "moderate" | "hot">(
    "moderate"
  );

  if (!isOpen) return null;

  // Scientific calculation: approx 35ml per kg base + activity add-on + climate add-on
  const calculateRecommendedGoal = () => {
    let base = weightKg * 35;
    if (activity === "moderate") base += 400;
    if (activity === "high") base += 800;
    if (climate === "hot") base += 500;
    const rounded = Math.round(base / 50) * 50;
    setGoalInput(rounded);
  };

  const PRESETS = [2000, 2500, 3000, 3500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-sky-100 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Hydration Goal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Target volume display & direct adjust */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Selected Target
            </span>
            <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">
              {formatVolume(goalInput, unit)}
            </span>
            <div className="mt-3 flex justify-center gap-1.5">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGoalInput(val)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    goalInput === val
                      ? "bg-sky-500 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-50"
                  }`}
                >
                  {formatVolume(val, unit)}
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-sky-500" />
              <span>Smart Hydration Calculator</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Body Weight ({weightKg} kg / {Math.round(weightKg * 2.2)} lbs)
                </label>
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Daily Activity
                </label>
                <select
                  value={activity}
                  onChange={(e: any) => setActivity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value="light">Light / Desk job</option>
                  <option value="moderate">Moderate exercise</option>
                  <option value="high">Intense workout</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={calculateRecommendedGoal}
              className="w-full py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-sky-600 dark:text-sky-300 text-xs font-semibold border border-sky-200 dark:border-slate-600 transition-colors"
            >
              Calculate Recommended Goal
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onSaveGoal(goalInput);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Apply Goal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
