const db = require('../config/db');
const { validateReadingInput } = require('../utils/validation');

// POST /api/readings
const createReading = async (req, res, next) => {
  try {
    const { reading_date, slot, value } = req.body;

    const validation = validateReadingInput({ reading_date, slot, value });
    if (!validation.isValid) {
      return res.status(validation.status).json({
        error: validation.message,
      });
    }

    const {
      reading_date: cleanDate,
      slot: cleanSlot,
      value: cleanValue,
    } = validation.sanitized;

    // Check duplicate slot on the same day for this user
    const existingSlot = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3',
      [req.user.id, cleanDate, cleanSlot]
    );

    if (existingSlot.rows.length > 0) {
      return res.status(400).json({
        error: `You already have an ${cleanSlot} reading for this date.`,
      });
    }

    // Check if 4 readings already exist on this day
    const dayCountResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [req.user.id, cleanDate]
    );

    if (dayCountResult.rows[0].count >= 4) {
      return res.status(400).json({
        error: 'You can add only 4 readings per day.',
      });
    }

    // Insert new reading
    const insertResult = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, slot, value, created_at, updated_at`,
      [req.user.id, cleanDate, cleanSlot, cleanValue]
    );

    return res.status(201).json({
      message: 'Reading added successfully.',
      reading: insertResult.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      const slotName = req.body.slot || 'slot';
      return res.status(400).json({
        error: `You already have an ${slotName} reading for this date.`,
      });
    }
    next(err);
  }
};

// GET /api/readings
const getReadings = async (req, res, next) => {
  try {
    const { date, page, limit } = req.query;

    const baseWhere = ['user_id = $1'];
    const queryParams = [req.user.id];

    if (date) {
      queryParams.push(date);
      baseWhere.push(`reading_date = $${queryParams.length}`);
    }

    const whereClause = `WHERE ${baseWhere.join(' AND ')}`;

    // Optional pagination support
    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const countResult = await db.query(
        `SELECT COUNT(*)::int AS total FROM readings ${whereClause}`,
        queryParams
      );
      const total = countResult.rows[0].total;

      const pagedParams = [...queryParams, limitNum, offset];
      const readingsResult = await db.query(
        `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
         FROM readings
         ${whereClause}
         ORDER BY reading_date DESC, id DESC
         LIMIT $${pagedParams.length - 1} OFFSET $${pagedParams.length}`,
        pagedParams
      );

      return res.status(200).json({
        readings: readingsResult.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    // Default: return all readings for user (optionally filtered by date)
    const result = await db.query(
      `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
       FROM readings
       ${whereClause}
       ORDER BY reading_date DESC, id DESC`,
      queryParams
    );

    return res.status(200).json({
      readings: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/readings/:id
const getReadingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, user_id, reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reading not found.',
      });
    }

    return res.status(200).json({
      reading: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/readings/:id
const updateReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reading_date, slot, value } = req.body;

    // Check if reading exists and belongs to current user
    const existing = await db.query(
      'SELECT id, reading_date, slot, value FROM readings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Reading not found.',
      });
    }

    const current = existing.rows[0];

    const targetDate = reading_date !== undefined ? reading_date : current.reading_date;
    const targetSlot = slot !== undefined ? slot : current.slot;
    const targetValue = value !== undefined ? value : current.value;

    const validation = validateReadingInput({
      reading_date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });

    if (!validation.isValid) {
      return res.status(validation.status).json({
        error: validation.message,
      });
    }

    const {
      reading_date: cleanDate,
      slot: cleanSlot,
      value: cleanValue,
    } = validation.sanitized;

    // Check duplicate slot on target date (excluding this reading)
    const slotConflict = await db.query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id != $4`,
      [req.user.id, cleanDate, cleanSlot, id]
    );

    if (slotConflict.rows.length > 0) {
      return res.status(400).json({
        error: `You already have an ${cleanSlot} reading for this date.`,
      });
    }

    // Check if moving to a date that already has 4 readings
    if (cleanDate !== current.reading_date) {
      const dayCount = await db.query(
        `SELECT COUNT(*)::int AS count FROM readings
         WHERE user_id = $1 AND reading_date = $2 AND id != $3`,
        [req.user.id, cleanDate, id]
      );

      if (dayCount.rows[0].count >= 4) {
        return res.status(400).json({
          error: 'You can add only 4 readings per day.',
        });
      }
    }

    // Update reading
    const updateResult = await db.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, slot, value, created_at, updated_at`,
      [cleanDate, cleanSlot, cleanValue, id, req.user.id]
    );

    return res.status(200).json({
      message: 'Reading updated successfully.',
      reading: updateResult.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      const slotName = req.body.slot || 'slot';
      return res.status(400).json({
        error: `You already have an ${slotName} reading for this date.`,
      });
    }
    next(err);
  }
};

// DELETE /api/readings/:id
const deleteReading = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reading not found.',
      });
    }

    return res.status(200).json({
      message: 'Reading deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
