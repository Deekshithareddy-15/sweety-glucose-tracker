const db = require('../config/db');
const { getTodayDateString } = require('../utils/validation');
const {
  formatDailyLabel,
  getMonthToDateBounds,
  getPreviousMonthBounds,
} = require('../utils/dateHelper');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Helper to validate or default the input date
function getValidDateOrThrow(queryDate) {
  const dateStr = queryDate || getTodayDateString();
  if (!DATE_REGEX.test(dateStr)) {
    const error = new Error('Invalid date format. Expected YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }
  return dateStr;
}

// GET /api/reports/daily?date=YYYY-MM-DD
const getDailyReport = async (req, res, next) => {
  try {
    const dateStr = getValidDateOrThrow(req.query.date);

    // Aggregate query
    const statsResult = await db.query(
      `SELECT
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1)::float AS average,
         COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [req.user.id, dateStr]
    );

    const stats = statsResult.rows[0];
    const count = stats.count || 0;

    // Readings query for this specific date
    const readingsResult = await db.query(
      `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC, id ASC`,
      [req.user.id, dateStr]
    );

    return res.status(200).json({
      reportType: 'daily',
      date: dateStr,
      dateLabel: formatDailyLabel(dateStr),
      summary: {
        highest: count > 0 ? stats.highest : null,
        lowest: count > 0 ? stats.lowest : null,
        average: count > 0 ? stats.average : null,
        count: count,
      },
      readings: readingsResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/month-to-date?date=YYYY-MM-DD
const getMonthToDateReport = async (req, res, next) => {
  try {
    const dateStr = getValidDateOrThrow(req.query.date);
    const { startDate, endDate, label } = getMonthToDateBounds(dateStr);

    const statsResult = await db.query(
      `SELECT
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1)::float AS average,
         COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [req.user.id, startDate, endDate]
    );

    const stats = statsResult.rows[0];
    const count = stats.count || 0;

    const readingsResult = await db.query(
      `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [req.user.id, startDate, endDate]
    );

    return res.status(200).json({
      reportType: 'month-to-date',
      startDate,
      endDate,
      dateRangeLabel: label,
      summary: {
        highest: count > 0 ? stats.highest : null,
        lowest: count > 0 ? stats.lowest : null,
        average: count > 0 ? stats.average : null,
        count: count,
      },
      readings: readingsResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly?date=YYYY-MM-DD
// Note: Monthly means PREVIOUS MONTH, not current month
const getMonthlyReport = async (req, res, next) => {
  try {
    const dateStr = getValidDateOrThrow(req.query.date);
    const { startDate, endDate, label, prevMonthName, prevYear } =
      getPreviousMonthBounds(dateStr);

    const statsResult = await db.query(
      `SELECT
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1)::float AS average,
         COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [req.user.id, startDate, endDate]
    );

    const stats = statsResult.rows[0];
    const count = stats.count || 0;

    const readingsResult = await db.query(
      `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [req.user.id, startDate, endDate]
    );

    return res.status(200).json({
      reportType: 'monthly',
      period: 'Previous Month',
      prevMonthName,
      prevYear,
      startDate,
      endDate,
      dateRangeLabel: label,
      summary: {
        highest: count > 0 ? stats.highest : null,
        lowest: count > 0 ? stats.lowest : null,
        average: count > 0 ? stats.average : null,
        count: count,
      },
      readings: readingsResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
};
