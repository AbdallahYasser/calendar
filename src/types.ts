export type DayType = 'office' | 'home' | 'holiday' | 'sick' | 'casual' | 'vacation' | 'night';

export interface DayData {
  type: DayType;
  extraHours?: number;
  notes?: string;
}

export interface VacationAllowance {
  year: number;
  daysAllowed: number;
}

export interface WorkState {
  selectedDate: Date;
  vacationDays: Record<number, number>;
  dayData: Record<string, DayData>;
  previousDayData: Record<string, DayData> | null;
  setSelectedDate: (date: Date) => void;
  setVacationDays: (year: number, days: number) => void;
  setDayData: (date: string, data: DayData) => void;
  resetMonth: () => void;
  resetAll: () => void;
  clearDay: (date: string) => void;
  restoreData: () => void;
  syncData: () => Promise<void>;
}