export type Shift = '早' | '午' | '晚' | '加';

export interface RequiredShifts {
  morning: number;
  afternoon: number;
  evening: number;
  maxPerPerson?: number;
}

export interface PharmacistStats {
  holidays: number;
  shifts: number;
  morningEveningDays: number;
  mondayHolidays: number;
  saturdayHolidays: number;
}

export interface Schedule {
  [dateKey: string]: {
    [pharmacist: string]: Shift[];
  };
}

export interface Notes {
  [dateKey: string]: string;
} 