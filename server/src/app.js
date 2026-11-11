const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
// readingRoutes and reportRoutes will be mounted as we build them

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Sweety Blood Glucose Tracker API' });
});

// Mount Routes
app.use('/api/auth', authRoutes);

// Fallback 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
