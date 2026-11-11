const request = require('supertest');
const app = require('../src/app');
const { initTestDb, clearTestDb, closeDb } = require('./helpers/dbHelper');

describe('Full Lifecycle End-to-End Integration Suite', () => {
  beforeAll(async () => {
    await initTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('verifies the complete user workflow from signup to reports and deletion', async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Health check
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');

    // 2. Signup
    const signupRes = await request(app).post('/api/auth/signup').send({
      name: 'Integration User',
      email: 'flow@sweety.local',
      password: 'SecurePassword123',
    });
    expect(signupRes.status).toBe(201);
    const token = signupRes.body.token;

    // 3. Initial Daily Report (Empty state)
    const initialReport = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    expect(initialReport.status).toBe(200);
    expect(initialReport.body.summary.count).toBe(0);
    expect(initialReport.body.summary.highest).toBeNull();

    // 4. Log 4 readings throughout the day
    const slots = [
      { slot: 'Morning (fasting)', value: 88 },
      { slot: 'After breakfast', value: 135 },
      { slot: 'After lunch', value: 118 },
      { slot: 'After dinner', value: 142 },
    ];

    const createdReadings = [];
    for (const item of slots) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reading_date: today,
          slot: item.slot,
          value: item.value,
        });
      expect(res.status).toBe(201);
      createdReadings.push(res.body.reading);
    }

    // 5. Attempt 5th reading on same day
    const fifthRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reading_date: today,
        slot: 'Morning (fasting)',
        value: 90,
      });
    expect(fifthRes.status).toBe(400);

    // 6. Check updated daily report
    const updatedDaily = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    expect(updatedDaily.status).toBe(200);
    expect(updatedDaily.body.summary.count).toBe(4);
    expect(updatedDaily.body.summary.lowest).toBe(88);
    expect(updatedDaily.body.summary.highest).toBe(142);
    // (88 + 135 + 118 + 142) / 4 = 483 / 4 = 120.75 -> rounded to 120.8
    expect(updatedDaily.body.summary.average).toBe(120.8);

    // 7. Update one reading
    const breakfastReading = createdReadings.find(
      (r) => r.slot === 'After breakfast'
    );
    const updateRes = await request(app)
      .put(`/api/readings/${breakfastReading.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reading_date: today,
        slot: 'After breakfast',
        value: 125,
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.reading.value).toBe(125);

    // 8. Delete dinner reading
    const dinnerReading = createdReadings.find(
      (r) => r.slot === 'After dinner'
    );
    const deleteRes = await request(app)
      .delete(`/api/readings/${dinnerReading.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // 9. Now that dinner was deleted, we should be able to log dinner again with new value
    const reAddDinner = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reading_date: today,
        slot: 'After dinner',
        value: 130,
      });
    expect(reAddDinner.status).toBe(201);
    expect(reAddDinner.body.reading.value).toBe(130);
  });
});
