export type BeverageType =
  | "Water"
  | "Sparkling Water"
  | "Lemon Water"
  | "Herbal Tea"
  | "Coconut Water"
  | "Electrolytes"
  | "Coffee";

export interface WaterEntry {
  id: string;
  timestamp: string; // ISO string
  amountMl: number;
  beverage: BeverageType | string;
  notes?: string;
  isVoice?: boolean;
}

export interface DayHistory {
  date: string; // YYYY-MM-DD
  totalMl: number;
  goalMl: number;
  completed: boolean;
  entriesCount: number;
}

export interface ReminderConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 45, 60, 90
  startHour: number; // 0-23, default 8 (8 AM)
  endHour: number; // 0-23, default 22 (10 PM)
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  lastRemindedAt: number | null;
  snoozedUntil: number | null;
}

export interface HydrationCoachAdvice {
  reminderMessage: string;
  statusInsight: string;
  suggestedNextIntakeMl: number;
  funFact: string;
}

export type UnitMode = "ml" | "oz";

export const ML_TO_OZ = 0.033814;
export const OZ_TO_ML = 29.5735;

export function formatVolume(ml: number, unit: UnitMode): string {
  if (unit === "oz") {
    const oz = Math.round(ml * ML_TO_OZ * 10) / 10;
    return `${oz} fl oz`;
  }
  return `${Math.round(ml)} ml`;
}
