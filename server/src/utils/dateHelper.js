const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Parses YYYY-MM-DD string into year, month (1-12), day integers
 */
function parseDateParts(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
}

/**
 * Returns formatted Daily date label: e.g. "15 October 2026"
 */
function formatDailyLabel(dateStr) {
  const { year, month, day } = parseDateParts(dateStr);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Calculates Month-To-Date date boundaries:
 * From 1st of selected month to selected date inclusive.
 * e.g. for "2026-10-15" -> startDate: "2026-10-01", endDate: "2026-10-15", label: "1–15 October 2026"
 */
function getMonthToDateBounds(dateStr) {
  const { year, month, day } = parseDateParts(dateStr);
  const monthPadded = String(month).padStart(2, '0');
  const startDate = `${year}-${monthPadded}-01`;
  const endDate = dateStr;
  const label = `1–${day} ${MONTH_NAMES[month - 1]} ${year}`;

  return {
    startDate,
    endDate,
    label,
  };
}

/**
 * Calculates Monthly (PREVIOUS calendar month) date boundaries:
 * For example:
 * - "2026-10-15" -> Previous month is September 2026: "2026-09-01" to "2026-09-30", label: "1–30 September 2026"
 * - "2026-01-15" -> Previous month is December 2025: "2025-12-01" to "2025-12-31", label: "1–31 December 2025"
 */
function getPreviousMonthBounds(dateStr) {
  const { year, month } = parseDateParts(dateStr);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  // Days in previous month
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();

  const prevMonthPadded = String(prevMonth).padStart(2, '0');
  const startDate = `${prevYear}-${prevMonthPadded}-01`;
  const endDate = `${prevYear}-${prevMonthPadded}-${String(lastDay).padStart(2, '0')}`;
  const label = `1–${lastDay} ${MONTH_NAMES[prevMonth - 1]} ${prevYear}`;

  return {
    startDate,
    endDate,
    label,
    prevMonthName: MONTH_NAMES[prevMonth - 1],
    prevYear,
  };
}

module.exports = {
  MONTH_NAMES,
  parseDateParts,
  formatDailyLabel,
  getMonthToDateBounds,
  getPreviousMonthBounds,
};
