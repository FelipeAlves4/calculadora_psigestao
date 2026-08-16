import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { createRequestHandler } from './app.mjs';
import { createDatabase } from './database.mjs';

const createClient = (baseUrl) => {
  const cookies = new Map();
  let csrfToken = '';

  const saveCookies = (headers) => {
    for (const value of headers.getSetCookie()) {
      const [pair] = value.split(';');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      const content = pair.slice(separator + 1);
      if (content) cookies.set(name, content);
      else cookies.delete(name);
    }
  };

  const request = async (path, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method) && !csrfToken) {
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
      saveCookies(csrfResponse.headers);
      csrfToken = (await csrfResponse.json()).csrfToken;
    }
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (csrfToken && !['GET', 'HEAD'].includes(method)) headers.set('X-CSRF-Token', csrfToken);
    if (cookies.size) headers.set('Cookie', [...cookies].map(([name, value]) => `${name}=${value}`).join('; '));
    headers.set('Origin', baseUrl);
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    saveCookies(response.headers);
    return { status: response.status, body: await response.json() };
  };

  return { request };
};

const setup = async () => {
  const db = await createDatabase(':memory:');
  const now = new Date().toISOString();
  await db.run(`
    INSERT INTO users (id, name, phone, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?, ?)
  `, randomUUID(), 'Administrador ASEX', '11999999999', 'admin@asex.test', await bcrypt.hash('Admin123', 4), now, now);

  let sentResetUrl = '';
  const config = {
    isProduction: false,
    appUrl: '',
    authSecret: 'test-secret-with-enough-entropy',
    sessionHours: 12,
    rememberedSessionDays: 30,
    resetTokenMinutes: 30,
    emailApiKey: 'test',
    emailFrom: 'test@asex.test',
  };
  const emailSender = async ({ resetUrl }) => {
    sentResetUrl = resetUrl;
    return true;
  };
  const server = createServer(createRequestHandler({ db, config, emailSender }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  config.appUrl = baseUrl;

  return {
    db,
    baseUrl,
    getResetUrl: () => sentResetUrl,
    close: () => new Promise((resolve) => server.close(async () => { await db.close(); resolve(); })),
  };
};

const registerAgent = (client, email = 'agente@asex.test') => client.request('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Agente de Expansão',
    phone: '(11) 98888-7777',
    email,
    password: 'Agente123',
    passwordConfirmation: 'Agente123',
    acceptTerms: true,
    role: 'admin',
    status: 'blocked',
  }),
});

test('cadastro público força perfil agent e armazena somente o hash da senha', async () => {
  const app = await setup();
  try {
    const client = createClient(app.baseUrl);
    const response = await registerAgent(client);
    assert.equal(response.status, 201);
    const user = await app.db.get("SELECT * FROM users WHERE email = 'agente@asex.test'");
    assert.equal(user.role, 'agent');
    assert.equal(user.status, 'active');
    assert.equal(user.phone, '11988887777');
    assert.notEqual(user.password_hash, 'Agente123');
    assert.equal(await bcrypt.compare('Agente123', user.password_hash), true);
  } finally {
    await app.close();
  }
});

test('login cria sessão segura e bloqueio administrativo rejeita a sessão existente', async () => {
  const app = await setup();
  try {
    const registrationClient = createClient(app.baseUrl);
    await registerAgent(registrationClient);

    const agent = createClient(app.baseUrl);
    const agentLogin = await agent.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agente@asex.test', password: 'Agente123' }) });
    assert.equal(agentLogin.status, 200);
    assert.equal('passwordHash' in agentLogin.body.user, false);
    assert.equal((await agent.request('/api/auth/me')).status, 200);

    const admin = createClient(app.baseUrl);
    assert.equal((await admin.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@asex.test', password: 'Admin123' }) })).status, 200);
    const user = await app.db.get("SELECT id FROM users WHERE email = 'agente@asex.test'");
    assert.equal((await admin.request(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'blocked' }) })).status, 200);
    assert.equal((await agent.request('/api/auth/me')).status, 401);
    const blockedLogin = await agent.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agente@asex.test', password: 'Agente123' }) });
    assert.equal(blockedLogin.status, 403);
    assert.equal(blockedLogin.body.message, 'Seu acesso está indisponível.');
  } finally {
    await app.close();
  }
});

test('o único administrador ativo não pode remover o próprio acesso', async () => {
  const app = await setup();
  try {
    const admin = createClient(app.baseUrl);
    const login = await admin.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@asex.test', password: 'Admin123' }) });
    const response = await admin.request(`/api/admin/users/${login.body.user.id}`, { method: 'PATCH', body: JSON.stringify({ role: 'agent' }) });
    assert.equal(response.status, 409);
    assert.match(response.body.message, /único administrador ativo/i);
  } finally {
    await app.close();
  }
});

test('recuperação usa token temporário de uso único e invalida sessões', async () => {
  const app = await setup();
  try {
    const client = createClient(app.baseUrl);
    await registerAgent(client);
    const login = await client.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agente@asex.test', password: 'Agente123' }) });
    assert.equal(login.status, 200);

    const forgot = await client.request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'agente@asex.test' }) });
    assert.equal(forgot.status, 200);
    assert.match(forgot.body.message, /Caso exista uma conta/);
    const token = new URL(app.getResetUrl()).searchParams.get('token');
    assert.ok(token);

    const reset = await client.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'NovaSenha123', passwordConfirmation: 'NovaSenha123' }),
    });
    assert.equal(reset.status, 200);
    assert.equal((await client.request('/api/auth/me')).status, 401);

    const reused = await client.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'OutraSenha123', passwordConfirmation: 'OutraSenha123' }),
    });
    assert.equal(reused.status, 400);
    const newLogin = await client.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agente@asex.test', password: 'NovaSenha123' }) });
    assert.equal(newLogin.status, 200);
  } finally {
    await app.close();
  }
});
