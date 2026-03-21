import NepaliDate from "nepali-date-converter";

const NEPALI_MONTHS = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

/**
 * Convert an English date string (YYYY-MM-DD) to Nepali (BS) in English.
 * e.g. "2026-04-01" → "2082-12-19 Chaitra"
 */
export function toNepaliDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const nepDate = new NepaliDate(date);
    const year = nepDate.getYear();
    const month = nepDate.getMonth(); // 0-indexed
    const day = nepDate.getDate();
    const monthName = NEPALI_MONTHS[month];
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    return `${year}/${mm}/${dd}-${monthName}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get current Nepali year.
 */
export function getNepaliYear(): number {
  const nepDate = new NepaliDate(new Date());
  return nepDate.getYear();
}

/**
 * Get today's date in Nepali format (English script).
 * e.g. "2082-12-06 Chaitra"
 */
export function getTodayNepali(): string {
  const nepDate = new NepaliDate(new Date());
  const year = nepDate.getYear();
  const month = nepDate.getMonth();
  const day = nepDate.getDate();
  const monthName = NEPALI_MONTHS[month];
  const dd = String(day).padStart(2, "0");
  const mm = String(month + 1).padStart(2, "0");
  return `${year}-${mm}-${dd} ${monthName}`;
}
