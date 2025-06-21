import { RequiredShifts, Shift } from '@/types/schedule';

export const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
};

export const getDayName = (date: Date): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[date.getDay()];
};

export const getRequiredShifts = (date: Date): RequiredShifts => {
  const dayOfWeek = date.getDay();
  
  switch (dayOfWeek) {
    case 1: // 週一
      return { morning: 2, afternoon: 2, evening: 2, maxPerPerson: 2 };
    case 2:
    case 3:
    case 4:
    case 5: // 週二~五
      return { morning: 1, afternoon: 1, evening: 2 };
    case 6: // 週六
      return { morning: 2, afternoon: 1, evening: 1 };
    case 0: // 週日
      return { morning: 0, afternoon: 0, evening: 0 }; // 全天休息
    default:
      return { morning: 0, afternoon: 0, evening: 0 };
  }
};

export const calculateStats = (
  currentMonth: Date,
  schedule: { [dateKey: string]: { [pharmacist: string]: Shift[] } },
  pharmacists: string[]
) => {
  const days = getDaysInMonth(currentMonth);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats: { [key: string]: any } = {};
  
  pharmacists.forEach(pharmacist => {
    stats[pharmacist] = {
      holidays: 0,
      shifts: 0,
      morningEveningDays: 0,
      mondayHolidays: 0,
      saturdayHolidays: 0
    };
  });

  days.forEach(day => {
    const dateKey = day.toISOString().split('T')[0];
    const daySchedule = schedule[dateKey] || {};
    const dayOfWeek = day.getDay();
    
    pharmacists.forEach(pharmacist => {
      const shifts = daySchedule[pharmacist] || [];
      
      if (shifts.length === 0) {
        stats[pharmacist].holidays++;
        if (dayOfWeek === 1) stats[pharmacist].mondayHolidays++;
        if (dayOfWeek === 6) stats[pharmacist].saturdayHolidays++;
      } else {
        stats[pharmacist].shifts += shifts.length;
        if (shifts.includes('早') && shifts.includes('晚')) {
          stats[pharmacist].morningEveningDays++;
        }
      }
    });
  });

  return stats;
}; 