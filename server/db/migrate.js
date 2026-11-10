const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function migrate() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Running database schema migrations...');
    await pool.query(schemaSql);
    console.log('Database schema migrated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
