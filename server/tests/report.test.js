const request = require('supertest');
const app = require('../src/app');
const { initTestDb, clearTestDb, closeDb } = require('./helpers/dbHelper');

describe('Reports API (/api/reports)', () => {
  let user1Token;
  let user2Token;

  beforeAll(async () => {
    await initTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Create User 1
    const res1 = await request(app).post('/api/auth/signup').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });
    user1Token = res1.body.token;

    // Create User 2
    const res2 = await request(app).post('/api/auth/signup').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Token = res2.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('GET /api/reports/daily', () => {
    it('should return empty summary with nulls when no readings exist for date', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.reportType).toBe('daily');
      expect(res.body.date).toBe('2026-10-15');
      expect(res.body.dateLabel).toBe('15 October 2026');
      expect(res.body.summary).toEqual({
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      });
      expect(res.body.readings).toEqual([]);
    });

    it('should calculate accurate highest, lowest, rounded average and count for daily readings', async () => {
      // Add 3 readings for User 1 on 2026-10-15: 90, 140, 115
      // Avg: (90 + 140 + 115) / 3 = 345 / 3 = 115.0
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'After breakfast', value: 140 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'After lunch', value: 115 });

      // User 2 adds a reading on same date with high value - should NOT affect User 1
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 250 });

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.highest).toBe(140);
      expect(res.body.summary.lowest).toBe(90);
      expect(res.body.summary.average).toBe(115.0);
      expect(res.body.summary.count).toBe(3);
      expect(res.body.readings.length).toBe(3);
      expect(res.body.readings[0].slot).toBe('Morning (fasting)');
      expect(res.body.readings[1].slot).toBe('After breakfast');
      expect(res.body.readings[2].slot).toBe('After lunch');
    });

    it('should round average to one decimal place correctly', async () => {
      // Values: 100, 105 -> avg 102.5
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 100 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'After lunch', value: 105 });

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.average).toBe(102.5);
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('should include readings from 1st of month to selected date inclusive, excluding later dates in month', async () => {
      // 1st of Oct (included)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-01', slot: 'Morning (fasting)', value: 92 });

      // 10th of Oct (included)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-10', slot: 'Morning (fasting)', value: 98 });

      // 15th of Oct (included)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 110 });

      // 20th of Oct (EXCLUDED because selected date is 2026-10-15)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-20', slot: 'Morning (fasting)', value: 300 });

      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.reportType).toBe('month-to-date');
      expect(res.body.startDate).toBe('2026-10-01');
      expect(res.body.endDate).toBe('2026-10-15');
      expect(res.body.dateRangeLabel).toBe('1–15 October 2026');
      expect(res.body.summary.count).toBe(3);
      expect(res.body.summary.highest).toBe(110);
      expect(res.body.summary.lowest).toBe(92);
      expect(res.body.summary.average).toBe(100.0);
    });
  });

  describe('GET /api/reports/monthly (Previous Calendar Month)', () => {
    it('should aggregate the entire calendar month prior to selected date (September for October)', async () => {
      // September readings (target previous month)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-09-01', slot: 'Morning (fasting)', value: 85 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-09-30', slot: 'After dinner', value: 135 });

      // October reading (should NOT be included in monthly report for 2026-10-15)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-10-05', slot: 'Morning (fasting)', value: 200 });

      const res = await request(app)
        .get('/api/reports/monthly?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.reportType).toBe('monthly');
      expect(res.body.startDate).toBe('2026-09-01');
      expect(res.body.endDate).toBe('2026-09-30');
      expect(res.body.dateRangeLabel).toBe('1–30 September 2026');
      expect(res.body.summary.count).toBe(2);
      expect(res.body.summary.highest).toBe(135);
      expect(res.body.summary.lowest).toBe(85);
      expect(res.body.summary.average).toBe(110.0);
    });

    it('should correctly handle January boundary: previous month of Jan 2026 is Dec 2025', async () => {
      // December 2025 reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2025-12-15', slot: 'Morning (fasting)', value: 88 });

      // January 2026 reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: '2026-01-05', slot: 'Morning (fasting)', value: 150 });

      const res = await request(app)
        .get('/api/reports/monthly?date=2026-01-10')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe('2025-12-01');
      expect(res.body.endDate).toBe('2025-12-31');
      expect(res.body.dateRangeLabel).toBe('1–31 December 2025');
      expect(res.body.summary.count).toBe(1);
      expect(res.body.summary.highest).toBe(88);
      expect(res.body.summary.lowest).toBe(88);
    });
  });
});
