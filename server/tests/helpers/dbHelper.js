const fs = require('fs');
const path = require('path');
const { pool } = require('../../src/config/db');

// Ensure schema is created in the test database
async function initTestDb() {
  const schemaSql = fs.readFileSync(
    path.join(__dirname, '../../db/schema.sql'),
    'utf-8'
  );
  await pool.query(schemaSql);
}

// Clean all rows from users and readings
async function clearTestDb() {
  await pool.query('TRUNCATE users, readings RESTART IDENTITY CASCADE;');
}

async function closeDb() {
  await pool.end();
}

module.exports = {
  initTestDb,
  clearTestDb,
  closeDb,
};
