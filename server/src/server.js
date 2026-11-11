const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test DB connection before listening
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Connected to PostgreSQL successfully.');
    app.listen(PORT, () => {
      console.log(`Sweety API server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database:', err.message);
    process.exit(1);
  });
