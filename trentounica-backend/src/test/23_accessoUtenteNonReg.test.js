const request = require('supertest');
const app = require('../app');

describe('ACCESSO NON AUTENTICATO - Home pubblica', () => {
  it('dovrebbe mostrare il messaggio del server attivo', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Server TrentoUnica è attivo/i);

    console.log("✅ Home pubblica caricata correttamente.");
  });
});
