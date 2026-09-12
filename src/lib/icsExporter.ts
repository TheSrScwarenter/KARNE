import { ProgramItem } from '../types';

/**
 * Studii YKS - Client-Side ICS (iCalendar) Exporter
 * Zero database/Supabase storage consumption.
 * Generates RFC 5545 compliant .ics files directly in the browser.
 */

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const formatICSDate = (date: Date, hours: number, minutes: number): string => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(hours);
  const min = pad(minutes);
  const s = '00';
  return `${y}${m}${d}T${h}${min}${s}`;
};

/**
 * Computes Monday date of the current or specified week
 */
export const getMondayOfWeek = (baseDate?: Date | string): Date => {
  const d = baseDate ? new Date(baseDate) : new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const generateICSContent = (
  items: ProgramItem[],
  weekStartDate?: string | Date,
  studentName?: string
): string => {
  const monday = getMondayOfWeek(weekStartDate);
  const now = new Date();
  const dtstamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studii YKS//Haftalik Calisma Plani//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Studii - ${studentName ? studentName + ' ' : ''}YKS Haftalık Program`,
    'X-WR-TIMEZONE:Europe/Istanbul',
  ];

  items.forEach((item, idx) => {
    // day_of_week is 0 (Mon) to 6 (Sun)
    const dayOffset = typeof item.day_of_week === 'number' ? item.day_of_week : 0;
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayOffset);

    // Parse start_time and end_time (e.g. "09:00", "11:30") or default slots
    let startHour = 9 + (idx % 5) * 2;
    let startMin = 0;
    let endHour = startHour + 1;
    let endMin = 30;

    if (item.start_time && item.start_time.includes(':')) {
      const parts = item.start_time.split(':');
      startHour = parseInt(parts[0], 10) || startHour;
      startMin = parseInt(parts[1], 10) || 0;
    }

    if (item.end_time && item.end_time.includes(':')) {
      const parts = item.end_time.split(':');
      endHour = parseInt(parts[0], 10) || endHour;
      endMin = parseInt(parts[1], 10) || 0;
    } else {
      endHour = startHour + 1;
      endMin = startMin + 30;
      if (endMin >= 60) {
        endHour += Math.floor(endMin / 60);
        endMin = endMin % 60;
      }
    }

    const dtStart = formatICSDate(eventDate, startHour, startMin);
    const dtEnd = formatICSDate(eventDate, endHour, endMin);

    const title = `Studii: ${item.subject} - ${item.topic}`;
    const descriptionLines = [
      `Ders: ${item.subject}`,
      `Konu: ${item.topic}`,
      item.target_questions ? `Hedef Soru: ${item.target_questions}` : '',
      item.coach_notes ? `Koç Notu: ${item.coach_notes}` : '',
      item.ai_reasoning ? `Yapay Zeka Analizi: ${item.ai_reasoning}` : '',
      'Studii YKS Koçluk ve Çalışma Platformu',
    ].filter(Boolean);

    const description = descriptionLines.join('\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:studii-item-${item.id || idx}-${dtStart}@studii.app`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Studii Hatırlatıcı: ${item.subject} çalışma saati yaklaşıyor!`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Triggers a browser download of the ICS file
 */
export const downloadCalendarICS = (
  items: ProgramItem[],
  weekStartDate?: string | Date,
  studentName?: string
): void => {
  const icsText = generateICSContent(items, weekStartDate, studentName);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const fileName = `studii_yks_program_${new Date().toISOString().slice(0, 10)}.ics`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
