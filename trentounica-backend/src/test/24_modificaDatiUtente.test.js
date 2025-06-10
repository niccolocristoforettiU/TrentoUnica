const request = require('supertest');
const app = require('../app');

describe('MODIFICA PROFILO UTENTE - API', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'mario.rossi@gmail.com',
        password: 'Password123!'
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;
  });

  it('dovrebbe aggiornare il nome del profilo utente', async () => {
    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Mario Rossi Aggiornato'
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.user.name).toBe('Mario Rossi Aggiornato');

    console.log('✅ Nome utente aggiornato con successo:', updateRes.body.user.name);
  });
});
