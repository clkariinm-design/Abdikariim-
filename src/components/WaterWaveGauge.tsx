import React from "react";
import { formatVolume, UnitMode } from "../types";
import { Droplet, Flame, Trophy, Sparkles } from "lucide-react";

interface WaterWaveGaugeProps {
  currentMl: number;
  goalMl: number;
  unit: UnitMode;
  streakDays: number;
  onQuickAdd?: (amountMl: number) => void;
}

export const WaterWaveGauge: React.FC<WaterWaveGaugeProps> = ({
  currentMl,
  goalMl,
  unit,
  streakDays,
  onQuickAdd,
}) => {
  const percentage = Math.round((currentMl / goalMl) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const remainingMl = Math.max(0, goalMl - currentMl);
  const isGoalReached = currentMl >= goalMl;

  // Calculate SVG wave height position: 0% is at y=200, 100% is at y=0
  const waveY = 200 - (clampedPercent / 100) * 200;

  return (
    <div
      id="water-wave-gauge-card"
      className="relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-sm transition-all"
    >
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Droplet className="w-4 h-4 fill-sky-500/20" />
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Daily Progress
          </span>
        </div>

        {streakDays > 0 && (
          <div
            id="streak-badge"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 text-xs font-semibold"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>{streakDays} Day Streak</span>
          </div>
        )}
      </div>

      {/* Circular Wave Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
        {/* Outer subtle glow ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            isGoalReached
              ? "ring-4 ring-emerald-400/50 dark:ring-emerald-500/40 shadow-xl shadow-emerald-500/10"
              : "ring-4 ring-sky-200/60 dark:ring-sky-900/60"
          }`}
        />

        {/* Clipped inner circle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden bg-gradient-to-b from-sky-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-900/90 shadow-inner flex items-center justify-center">
          {/* Animated Water SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isGoalReached ? "#34d399" : "#38bdf8"}
                />
                <stop
                  offset="100%"
                  stopColor={isGoalReached ? "#059669" : "#0284c7"}
                />
              </linearGradient>
              <linearGradient id="waveGradBack" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isGoalReached ? "#6ee7b7" : "#7dd3fc"}
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor={isGoalReached ? "#10b981" : "#0ea5e9"}
                  stopOpacity="0.4"
                />
              </linearGradient>
            </defs>

            {/* Background Wave */}
            <path
              fill="url(#waveGradBack)"
              d={`M0,${waveY} C30,${waveY - 8} 70,${waveY + 8} 100,${waveY} C130,${
                waveY - 8
              } 170,${waveY + 8} 200,${waveY} L200,200 L0,200 Z`}
            >
              <animate
                attributeName="d"
                dur="4s"
                repeatCount="indefinite"
                values={`
                  M0,${waveY} C30,${waveY - 7} 70,${waveY + 7} 100,${waveY} C130,${waveY - 7} 170,${waveY + 7} 200,${waveY} L200,200 L0,200 Z;
                  M0,${waveY} C40,${waveY + 8} 80,${waveY - 6} 120,${waveY + 7} C160,${waveY - 8} 180,${waveY + 4} 200,${waveY} L200,200 L0,200 Z;
                  M0,${waveY} C30,${waveY - 7} 70,${waveY + 7} 100,${waveY} C130,${waveY - 7} 170,${waveY + 7} 200,${waveY} L200,200 L0,200 Z
                `}
              />
            </path>

            {/* Foreground Wave */}
            <path
              fill="url(#waterGrad)"
              d={`M0,${waveY} C40,${waveY + 6} 80,${waveY - 8} 120,${waveY + 5} C160,${
                waveY - 6
              } 190,${waveY + 6} 200,${waveY} L200,200 L0,200 Z`}
            >
              <animate
                attributeName="d"
                dur="3s"
                repeatCount="indefinite"
                values={`
                  M0,${waveY} C40,${waveY + 6} 80,${waveY - 8} 120,${waveY + 5} C160,${waveY - 6} 190,${waveY + 6} 200,${waveY} L200,200 L0,200 Z;
                  M0,${waveY} C25,${waveY - 7} 65,${waveY + 7} 105,${waveY - 5} C145,${waveY + 7} 180,${waveY - 6} 200,${waveY} L200,200 L0,200 Z;
                  M0,${waveY} C40,${waveY + 6} 80,${waveY - 8} 120,${waveY + 5} C160,${waveY - 6} 190,${waveY + 6} 200,${waveY} L200,200 L0,200 Z
                `}
              />
            </path>
          </svg>

          {/* Floating Subtle Bubbles */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <span
              className="absolute w-2 h-2 rounded-full bg-white animate-ping"
              style={{ bottom: "25%", left: "30%", animationDuration: "3s" }}
            />
            <span
              className="absolute w-3 h-3 rounded-full bg-white/70 animate-bounce"
              style={{ bottom: "18%", right: "35%", animationDuration: "4s" }}
            />
          </div>

          {/* Center Numerical Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
              {percentage}%
            </span>
            <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatVolume(currentMl, unit)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              of {formatVolume(goalMl, unit)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status pill */}
      <div className="mt-3 flex items-center justify-center">
        {isGoalReached ? (
          <div
            id="goal-reached-indicator"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold"
          >
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span>Daily Hydration Goal Met! You're thriving.</span>
          </div>
        ) : (
          <div
            id="goal-remaining-indicator"
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {formatVolume(remainingMl, unit)}
              </strong>{" "}
              remaining to reach today's target
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
