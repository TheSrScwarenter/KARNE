/**
 * YKS Dynamic Countdown & Date Calculation Utility
 * Automatically targets the upcoming YKS (TYT / AYT) exam date and provides live time breakdowns.
 */

export type ExamSessionType = 'TYT' | 'AYT';

export interface YksCountdownData {
  targetDate: Date;
  targetYear: number;
  sessionType: ExamSessionType;
  formattedTargetDate: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSecondsLeft: number;
  progressPercent: number;
  isPast: boolean;
}

const KNOWN_EXAM_DATES: Record<number, { TYT: Date; AYT: Date }> = {
  2025: {
    TYT: new Date(2025, 5, 21, 10, 15, 0),
    AYT: new Date(2025, 5, 22, 10, 15, 0),
  },
  2026: {
    TYT: new Date(2026, 5, 20, 10, 15, 0),
    AYT: new Date(2026, 5, 21, 10, 15, 0),
  },
  2027: {
    TYT: new Date(2027, 5, 19, 10, 15, 0),
    AYT: new Date(2027, 5, 20, 10, 15, 0),
  },
};

export const TARGET_YEAR_STORAGE_KEY = 'karne_target_exam_year';
export const TARGET_SESSION_STORAGE_KEY = 'karne_target_exam_session';

export function getExamDate(year: number, session: ExamSessionType = 'TYT'): Date {
  if (KNOWN_EXAM_DATES[year]) {
    return KNOWN_EXAM_DATES[year][session];
  }
  // Dynamic fallback: 3rd Saturday for TYT, next day for AYT
  const juneFirst = new Date(year, 5, 1, 10, 15, 0);
  const dayOfWeek = juneFirst.getDay();
  const firstSaturday = 1 + ((6 - dayOfWeek + 7) % 7);
  const thirdSaturday = firstSaturday + 14;
  const tytDate = new Date(year, 5, thirdSaturday, 10, 15, 0);

  if (session === 'AYT') {
    return new Date(year, 5, thirdSaturday + 1, 10, 15, 0);
  }
  return tytDate;
}

export function getDefaultTargetYear(referenceDate: Date = new Date()): number {
  try {
    const saved = localStorage.getItem(TARGET_YEAR_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 2025 && parsed <= 2028) {
        return parsed;
      }
    }
  } catch {}

  const currentYear = referenceDate.getFullYear();
  const aytDateThisYear = getExamDate(currentYear, 'AYT');

  // If this year's exam hasn't finished yet, target this year; otherwise next year
  if (referenceDate.getTime() < aytDateThisYear.getTime()) {
    return currentYear;
  }
  return currentYear + 1;
}

export function getDefaultSessionType(): ExamSessionType {
  try {
    const saved = localStorage.getItem(TARGET_SESSION_STORAGE_KEY);
    if (saved === 'TYT' || saved === 'AYT') return saved;
  } catch {}
  return 'TYT';
}

/**
 * Computes full countdown details
 */
export function calculateYksCountdown(
  customYear?: number,
  customSession?: ExamSessionType,
  referenceDate: Date = new Date()
): YksCountdownData {
  const targetYear = customYear || getDefaultTargetYear(referenceDate);
  const sessionType = customSession || getDefaultSessionType();
  const targetDate = getExamDate(targetYear, sessionType);

  const diffMs = targetDate.getTime() - referenceDate.getTime();
  const totalSecondsLeft = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSecondsLeft / (3600 * 24));
  const hours = Math.floor((totalSecondsLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSecondsLeft % 3600) / 60);
  const seconds = totalSecondsLeft % 60;

  // Annual progress: from September 1st of previous year (start of season) to June exam date
  const seasonStart = new Date(targetYear - 1, 8, 1).getTime();
  const seasonEnd = targetDate.getTime();
  const totalSeasonMs = seasonEnd - seasonStart;
  const elapsedSeasonMs = Math.max(0, referenceDate.getTime() - seasonStart);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeasonMs / totalSeasonMs) * 100)));

  const formattedTargetDate = targetDate.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    targetDate,
    targetYear,
    sessionType,
    formattedTargetDate,
    days,
    hours,
    minutes,
    seconds,
    totalSecondsLeft,
    progressPercent,
    isPast: diffMs <= 0,
  };
}
