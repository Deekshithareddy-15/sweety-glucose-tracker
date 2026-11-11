const request = require('supertest');
const app = require('../src/app');
const { initTestDb, clearTestDb, closeDb } = require('./helpers/dbHelper');

describe('Reading CRUD API (/api/readings)', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  // Format today's date YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

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
    user1Id = res1.body.user.id;

    // Create User 2
    const res2 = await request(app).post('/api/auth/signup').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Token = res2.body.token;
    user2Id = res2.body.user.id;
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('Authorization checks', () => {
    it('should reject unauthorized access without token', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/token required/i);
    });
  });

  describe('POST /api/readings - Validation and Creation', () => {
    it('should successfully create a valid reading', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 95,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Reading added successfully.');
      expect(res.body.reading.slot).toBe('Morning (fasting)');
      expect(res.body.reading.value).toBe(95);
      expect(res.body.reading.reading_date).toBe(today);
      expect(res.body.reading.user_id).toBe(user1Id);
    });

    it('should reject when glucose value is missing', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    it('should reject glucose value below 40', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Value must be a whole number between 40 and 600 mg/dl.'
      );
    });

    it('should reject glucose value above 600', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Value must be a whole number between 40 and 600 mg/dl.'
      );
    });

    it('should reject decimal glucose value', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 105.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Value must be a whole number between 40 and 600 mg/dl.'
      );
    });

    it('should reject future date', async () => {
      const futureDate = '2099-12-31';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: futureDate,
          slot: 'Morning (fasting)',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });

    it('should reject invalid slot', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Midnight Snack',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Slot must be one of/i);
    });

    it('should reject duplicate slot on the same day with exact message', async () => {
      // First reading: After lunch
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'After lunch',
          value: 120,
        });

      // Attempt duplicate After lunch on same day
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'After lunch',
          value: 130,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'You already have an After lunch reading for this date.'
      );
    });

    it('should enforce 4 readings per day limit', async () => {
      const slots = [
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner',
      ];

      for (const slot of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            reading_date: today,
            slot,
            value: 100,
          });
        expect(res.status).toBe(201);
      }

      // Try 5th reading on another date first, then attempt on today
      const fifthRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 110,
        });

      // Should hit duplicate slot check or 4 readings per day limit
      expect(fifthRes.status).toBe(400);
    });
  });

  describe('PUT /api/readings/:id - Editing', () => {
    let readingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 95,
        });
      readingId = res.body.reading.id;
    });

    it('should allow updating value and slot', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'After breakfast',
          value: 140,
        });

      expect(res.status).toBe(200);
      expect(res.body.reading.value).toBe(140);
      expect(res.body.reading.slot).toBe('After breakfast');
    });

    it('should allow updating the current reading without triggering false duplicate slot error', async () => {
      // Keep same date and slot, just update value
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 105,
        });

      expect(res.status).toBe(200);
      expect(res.body.reading.value).toBe(105);
    });

    it('should prevent updating to a slot already taken on that date', async () => {
      // Create a second reading for After breakfast
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'After breakfast',
          value: 130,
        });

      // Try changing Morning (fasting) reading to After breakfast
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'After breakfast',
          value: 135,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'You already have an After breakfast reading for this date.'
      );
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('should delete a reading and return 200', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 95,
        });

      const readingId = res.body.reading.id;

      const deleteRes = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBe('Reading deleted successfully.');

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('User Isolation Security', () => {
    let user1ReadingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 95,
        });
      user1ReadingId = res.body.reading.id;
    });

    it('should NOT allow User 2 to view User 1 reading by ID', async () => {
      const res = await request(app)
        .get(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it('should NOT allow User 2 to edit User 1 reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 200,
        });

      expect(res.status).toBe(404);
    });

    it('should NOT allow User 2 to delete User 1 reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it('should NOT include User 1 readings in User 2 list', async () => {
      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.readings).toEqual([]);
    });

    it('should allow User 2 to have their own reading with same date and slot as User 1', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 105,
        });

      expect(res.status).toBe(201);
      expect(res.body.reading.value).toBe(105);
    });
  });

  describe('Optional Bonus: Pagination', () => {
    it('should paginate results when page and limit query params are provided', async () => {
      const date1 = '2026-10-01';
      const date2 = '2026-10-02';

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: date1, slot: 'Morning (fasting)', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: date1, slot: 'After lunch', value: 120 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: date2, slot: 'Morning (fasting)', value: 95 });

      const res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.readings.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });
});
