const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

// Realistic demo credentials (Local development / evaluation only)
const DEMO_USER = {
  name: 'Demo Patient',
  email: 'demo@sweety.local',
  password: 'Demo@12345',
};

// Generates dates formatted as YYYY-MM-DD offset from today
function getDateStringOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seed() {
  console.log('--- Starting Sweety Database Seeder ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check or create demo user
    let userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [DEMO_USER.email]
    );

    let userId;
    if (userResult.rows.length === 0) {
      console.log(`Creating demo user: ${DEMO_USER.email}`);
      const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
      const insertUser = await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [DEMO_USER.name, DEMO_USER.email, passwordHash]
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
      console.log(`Demo user exists (id: ${userId}). Clearing previous demo readings...`);
      await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);
    }

    // 2. Prepare sample readings across past 45 days (covering today, current month, and previous month)
    const sampleReadings = [
      // Today (4 slots)
      { date: getDateStringOffset(0), slot: 'Morning (fasting)', value: 92 },
      { date: getDateStringOffset(0), slot: 'After breakfast', value: 135 },
      { date: getDateStringOffset(0), slot: 'After lunch', value: 118 },
      { date: getDateStringOffset(0), slot: 'After dinner', value: 140 },

      // Yesterday (4 slots)
      { date: getDateStringOffset(1), slot: 'Morning (fasting)', value: 89 },
      { date: getDateStringOffset(1), slot: 'After breakfast', value: 128 },
      { date: getDateStringOffset(1), slot: 'After lunch', value: 114 },
      { date: getDateStringOffset(1), slot: 'After dinner', value: 132 },

      // 3 days ago
      { date: getDateStringOffset(3), slot: 'Morning (fasting)', value: 96 },
      { date: getDateStringOffset(3), slot: 'After lunch', value: 122 },
      { date: getDateStringOffset(3), slot: 'After dinner', value: 138 },

      // 5 days ago
      { date: getDateStringOffset(5), slot: 'Morning (fasting)', value: 91 },
      { date: getDateStringOffset(5), slot: 'After breakfast', value: 130 },

      // 7 days ago
      { date: getDateStringOffset(7), slot: 'Morning (fasting)', value: 94 },
      { date: getDateStringOffset(7), slot: 'After breakfast', value: 142 },
      { date: getDateStringOffset(7), slot: 'After lunch', value: 119 },
      { date: getDateStringOffset(7), slot: 'After dinner', value: 145 },

      // 12 days ago
      { date: getDateStringOffset(12), slot: 'Morning (fasting)', value: 88 },
      { date: getDateStringOffset(12), slot: 'After breakfast', value: 126 },
      { date: getDateStringOffset(12), slot: 'After lunch', value: 110 },

      // 18 days ago
      { date: getDateStringOffset(18), slot: 'Morning (fasting)', value: 93 },
      { date: getDateStringOffset(18), slot: 'After dinner', value: 139 },

      // 25 days ago
      { date: getDateStringOffset(25), slot: 'Morning (fasting)', value: 90 },
      { date: getDateStringOffset(25), slot: 'After breakfast', value: 134 },
      { date: getDateStringOffset(25), slot: 'After lunch', value: 116 },
      { date: getDateStringOffset(25), slot: 'After dinner', value: 141 },

      // 32 days ago (Previous Month)
      { date: getDateStringOffset(32), slot: 'Morning (fasting)', value: 95 },
      { date: getDateStringOffset(32), slot: 'After breakfast', value: 138 },
      { date: getDateStringOffset(32), slot: 'After lunch', value: 120 },
      { date: getDateStringOffset(32), slot: 'After dinner', value: 144 },

      // 38 days ago (Previous Month)
      { date: getDateStringOffset(38), slot: 'Morning (fasting)', value: 87 },
      { date: getDateStringOffset(38), slot: 'After breakfast', value: 125 },
      { date: getDateStringOffset(38), slot: 'After lunch', value: 112 },
      { date: getDateStringOffset(38), slot: 'After dinner', value: 130 },

      // 44 days ago (Previous Month)
      { date: getDateStringOffset(44), slot: 'Morning (fasting)', value: 92 },
      { date: getDateStringOffset(44), slot: 'After lunch', value: 118 },
      { date: getDateStringOffset(44), slot: 'After dinner', value: 136 },
    ];

    console.log(`Seeding ${sampleReadings.length} realistic readings...`);
    for (const r of sampleReadings) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [userId, r.date, r.slot, r.value]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Login Credentials:');
    console.log(`  Email:    ${DEMO_USER.email}`);
    console.log(`  Password: ${DEMO_USER.password}`);
    console.log('  NOTE: Demo credentials are for local development only.');
    console.log('----------------------------------------------------');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
