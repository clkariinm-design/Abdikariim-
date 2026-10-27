import React, { useState } from "react";
import {
  Plus,
  Mic,
  Coffee,
  CupSoda,
  Droplets,
  Wine,
  SlidersHorizontal,
  Check,
  Sparkles,
} from "lucide-react";
import { BeverageType, formatVolume, UnitMode } from "../types";

interface QuickLogBarProps {
  unit: UnitMode;
  onQuickAdd: (amountMl: number, beverage?: BeverageType, notes?: string) => void;
  onOpenVoiceModal: () => void;
}

const QUICK_PRESETS = [
  { label: "Cup", amount: 150, icon: Coffee },
  { label: "Glass", amount: 250, icon: Droplets },
  { label: "Mug", amount: 350, icon: Wine },
  { label: "Bottle", amount: 500, icon: CupSoda },
  { label: "Flask", amount: 750, icon: Droplets },
];

const BEVERAGE_TYPES: { type: BeverageType; emoji: string }[] = [
  { type: "Water", emoji: "💧" },
  { type: "Lemon Water", emoji: "🍋" },
  { type: "Sparkling Water", emoji: "🫧" },
  { type: "Herbal Tea", emoji: "🍵" },
  { type: "Coconut Water", emoji: "🥥" },
  { type: "Electrolytes", emoji: "⚡" },
  { type: "Coffee", emoji: "☕" },
];

export const QuickLogBar: React.FC<QuickLogBarProps> = ({
  unit,
  onQuickAdd,
  onOpenVoiceModal,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(300);
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageType>("Water");
  const [customNote, setCustomNote] = useState<string>("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount > 0) {
      onQuickAdd(customAmount, selectedBeverage, customNote || undefined);
      setShowCustomModal(false);
      setCustomNote("");
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Drink Logger
        </span>
        <div className="flex items-center gap-2">
          <button
            id="open-voice-logger-btn"
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
            title="Log water with voice using Gemini audio transcription"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Voice Log</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono">
              AI
            </span>
          </button>

          <button
            id="open-custom-drink-btn"
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-5 gap-2">
        {QUICK_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.amount}
              id={`quick-add-${preset.amount}ml`}
              onClick={() => onQuickAdd(preset.amount, "Water")}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 shadow-xs hover:shadow-sm transition-all active:scale-95 text-center"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 group-hover:bg-sky-100 transition-all mb-1">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {formatVolume(preset.amount, unit)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Drink Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-sky-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Log Custom Drink
            </h3>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {/* Beverage Type Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                  Beverage Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BEVERAGE_TYPES.map((b) => (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => setSelectedBeverage(b.type)}
                      className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        selectedBeverage === b.type
                          ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300 font-semibold"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{b.emoji}</span>
                      <span className="truncate">{b.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount slider / number input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Volume Amount
                  </label>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {formatVolume(customAmount, unit)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50 ml</span>
                  <span>500 ml</span>
                  <span>1000 ml</span>
                  <span>1500 ml</span>
                </div>
              </div>

              {/* Optional note */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Post-workout, with ice, etc."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  Log Drink
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
