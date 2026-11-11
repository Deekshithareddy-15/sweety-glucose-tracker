const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/auth');

// All report routes require authentication
router.use(authenticate);

router.get('/daily', reportController.getDailyReport);
router.get('/month-to-date', reportController.getMonthToDateReport);
router.get('/monthly', reportController.getMonthlyReport);

module.exports = router;
