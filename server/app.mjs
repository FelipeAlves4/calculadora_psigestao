import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { publicUser } from './database.mjs';
import {
  isValidBrazilianPhone,
  isValidEmail,
  isValidFullName,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  passwordErrors,
  validateRegistration,
} from './validation.mjs';
import { cookie, parseCookies, privacyHash, randomToken, safeEqual, tokenHash } from './security.mjs';

const JSON_LIMIT = 64 * 1024;
const SESSION_COOKIE = 'asex_session';
const CSRF_COOKIE = 'asex_csrf';
const genericResetMessage =
  'Caso exista uma conta associada a este e-mail, você receberá as instruções para redefinir sua senha.';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const setSecurityHeaders = (res, isProduction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
  }
};

const json = (res, status, payload, extraHeaders = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(payload));
};

const readJson = async (req) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    const error = new Error('Envie os dados no formato JSON.');
    error.status = 415;
    throw error;
  }

  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > JSON_LIMIT) {
      const error = new Error('Requisição muito grande.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('JSON inválido.');
    error.status = 400;
    throw error;
  }
};

const clientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return String(value || req.socket.remoteAddress || 'unknown').trim();
};

const consumeRateLimit = async (db, rawKey, maximum, windowMs) => {
  const id = privacyHash(rawKey);
  const now = Date.now();
  const row = await db.get('SELECT attempts, window_started_at FROM rate_limits WHERE id = ?', id);
  if (!row || now - row.window_started_at >= windowMs) {
    await db.run(`
      INSERT INTO rate_limits (id, attempts, window_started_at) VALUES (?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET attempts = 1, window_started_at = excluded.window_started_at
    `, id, now);
    return true;
  }

  const attempts = row.attempts + 1;
  await db.run('UPDATE rate_limits SET attempts = ? WHERE id = ?', attempts, id);
  return attempts <= maximum;
};

const clearRateLimit = (db, rawKey) => db.run('DELETE FROM rate_limits WHERE id = ?', privacyHash(rawKey));

const appendSetCookie = (res, value) => {
  const current = res.getHeader('Set-Cookie');
  const values = current ? (Array.isArray(current) ? current : [current]) : [];
  res.setHeader('Set-Cookie', [...values, value]);
};

const clearSessionCookies = (res, secure) => {
  appendSetCookie(res, cookie(SESSION_COOKIE, '', { httpOnly: true, secure, maxAge: 0 }));
  appendSetCookie(res, cookie(CSRF_COOKIE, '', { secure, maxAge: 0 }));
};

const clearSessionCookie = (res, secure) => {
  appendSetCookie(res, cookie(SESSION_COOKIE, '', { httpOnly: true, secure, maxAge: 0 }));
};

const ensureCsrf = (req, res, secure) => {
  const cookies = parseCookies(req.headers.cookie);
  const csrfToken = cookies[CSRF_COOKIE] || randomToken();
  if (!cookies[CSRF_COOKIE]) {
    appendSetCookie(res, cookie(CSRF_COOKIE, csrfToken, { secure, maxAge: 30 * 24 * 60 * 60 }));
  }
  return csrfToken;
};

const checkSameOrigin = (req, appUrl) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const appHost = appUrl ? new URL(appUrl).host : '';
    return originUrl.host === req.headers.host || originUrl.host === appHost;
  } catch {
    return false;
  }
};

const requireCsrf = (req, res, appUrl) => {
  const cookies = parseCookies(req.headers.cookie);
  const header = req.headers['x-csrf-token'];
  const csrfHeader = Array.isArray(header) ? header[0] : header;
  if (!checkSameOrigin(req, appUrl) || !safeEqual(cookies[CSRF_COOKIE], csrfHeader)) {
    json(res, 403, { message: 'Não foi possível validar esta solicitação. Atualize a página e tente novamente.' });
    return false;
  }
  return true;
};

const sessionUser = async (db, req, authSecret) => {
  const rawSession = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!rawSession) return null;
  const sessionId = tokenHash(rawSession, authSecret);
  const row = await db.get(`
    SELECT u.*, s.id AS session_id, s.expires_at AS session_expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `, sessionId);
  if (!row) return null;
  if (row.status !== 'active' || row.session_expires_at <= new Date().toISOString()) {
    await db.run('DELETE FROM sessions WHERE id = ?', sessionId);
    return null;
  }
  return { ...publicUser(row), sessionId };
};

const requireUser = async (db, req, res, authSecret, roles = ['agent', 'admin']) => {
  const user = await sessionUser(db, req, authSecret);
  if (!user) {
    json(res, 401, { message: 'Sua sessão expirou. Entre novamente para continuar.' });
    return null;
  }
  if (!roles.includes(user.role)) {
    json(res, 403, { message: 'Você não tem permissão para acessar esta área.' });
    return null;
  }
  return user;
};

const createSession = async (db, res, userId, remember, config) => {
  const rawToken = randomToken();
  const now = new Date();
  const durationMs = remember
    ? config.rememberedSessionDays * 24 * 60 * 60 * 1000
    : config.sessionHours * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs);
  await db.run('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    tokenHash(rawToken, config.authSecret),
    userId,
    now.toISOString(),
    expiresAt.toISOString(),
  );
  appendSetCookie(
    res,
    cookie(SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: remember ? durationMs / 1000 : undefined,
    }),
  );
};

const transaction = (db, callback) => db.transaction(callback);

const sendPasswordResetEmail = async ({ email, name, resetUrl, config, messageId }) => {
  if (!config.emailApiKey || !config.emailFrom) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.emailApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': messageId,
      'User-Agent': 'ASEX-Calculadora/1.0',
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [email],
      subject: 'Redefinição de senha — ASEX Educação',
      html: `<p>Olá, ${escapeHtml(name)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escapeHtml(resetUrl)}">Definir nova senha</a></p><p>Este link é válido por ${config.resetTokenMinutes} minutos e só pode ser usado uma vez.</p><p>Se você não fez esta solicitação, ignore esta mensagem.</p>`,
      text: `Olá, ${name}. Use este link para redefinir sua senha: ${resetUrl}. O link é válido por ${config.resetTokenMinutes} minutos e só pode ser usado uma vez.`,
    }),
  });
  if (!response.ok) throw new Error(`Falha do serviço de e-mail (${response.status}).`);
  return true;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const serveStatic = (req, res, distPath) => {
  if (!existsSync(distPath)) return false;
  const requestedPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(distPath, relativePath);
  const safePath = resolvedPath.startsWith(`${path.resolve(distPath)}${path.sep}`) ? resolvedPath : '';
  const filePath = safePath && existsSync(safePath) && statSync(safePath).isFile() ? safePath : path.join(distPath, 'index.html');
  if (!existsSync(filePath)) return false;
  const extension = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(res);
  return true;
};

export const createRequestHandler = ({ db, config, emailSender = sendPasswordResetEmail }) => async (req, res) => {
  setSecurityHeaders(res, config.isProduction);
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method || 'GET';

  try {
    if (method === 'GET' && pathname === '/api/health') return json(res, 200, { status: 'ok' });

    if (method === 'GET' && pathname === '/api/auth/csrf') {
      const csrfToken = ensureCsrf(req, res, config.isProduction);
      return json(res, 200, { csrfToken });
    }

    if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      if (!requireCsrf(req, res, config.appUrl)) return;
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = await readJson(req);
      const { data, errors } = validateRegistration(body);
      if (Object.keys(errors).length) return json(res, 400, { message: 'Revise os campos destacados.', errors });
      if (await db.get('SELECT id FROM users WHERE email = ?', data.email)) {
        return json(res, 409, { message: 'Já existe uma conta com este e-mail.', errors: { email: 'Este e-mail já está em uso.' } });
      }
      const now = new Date().toISOString();
      const passwordHash = await bcrypt.hash(data.password, 12);
      try {
        await db.run(`
          INSERT INTO users (id, name, phone, email, password_hash, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'agent', 'active', ?, ?)
        `, randomUUID(), data.name, data.phone, data.email, passwordHash, now, now);
      } catch (error) {
        if (error.code === '23505' || String(error.message).includes('UNIQUE')) {
          return json(res, 409, { message: 'Já existe uma conta com este e-mail.', errors: { email: 'Este e-mail já está em uso.' } });
        }
        throw error;
      }
      return json(res, 201, { message: 'Cadastro realizado com sucesso.' });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      const email = normalizeEmail(body.email);
      const rateKey = `login:${clientIp(req)}:${email}`;
      if (!(await consumeRateLimit(db, rateKey, 5, 15 * 60 * 1000))) {
        return json(res, 429, { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      }
      if (!isValidEmail(email) || typeof body.password !== 'string') {
        return json(res, 401, { message: 'E-mail ou senha inválidos.' });
      }
      const user = await db.get('SELECT * FROM users WHERE email = ?', email);
      const passwordMatches = user ? await bcrypt.compare(body.password, user.password_hash) : await bcrypt.compare(body.password, '$2b$12$wD2b9DwA2gYCHVVfBPYlAeF5XCc5YV90MkpXZQ4M5LzWwSN0yWvkG');
      if (!user || !passwordMatches) return json(res, 401, { message: 'E-mail ou senha inválidos.' });
      if (user.status !== 'active') {
        await db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
        return json(res, 403, {
          message: 'Seu acesso está indisponível.',
          detail: 'Entre em contato com a equipe da ASEX Educação.',
        });
      }
      await clearRateLimit(db, rateKey);
      const lastLoginAt = new Date().toISOString();
      await db.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', lastLoginAt, lastLoginAt, user.id);
      await createSession(db, res, user.id, body.remember === true, config);
      ensureCsrf(req, res, config.isProduction);
      return json(res, 200, { user: publicUser({ ...user, last_login_at: lastLoginAt, updated_at: lastLoginAt }) });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const rawSession = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      if (rawSession) await db.run('DELETE FROM sessions WHERE id = ?', tokenHash(rawSession, config.authSecret));
      clearSessionCookies(res, config.isProduction);
      return json(res, 200, { message: 'Sessão encerrada.' });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      const user = await sessionUser(db, req, config.authSecret);
      if (!user) {
        clearSessionCookie(res, config.isProduction);
        return json(res, 401, { message: 'Sua sessão expirou. Entre novamente para continuar.' });
      }
      const { sessionId: _sessionId, ...safeUser } = user;
      return json(res, 200, { user: safeUser });
    }

    if (method === 'POST' && pathname === '/api/auth/forgot-password') {
      const body = await readJson(req);
      const email = normalizeEmail(body.email);
      const rateKey = `reset:${clientIp(req)}:${email}`;
      const allowed = await consumeRateLimit(db, rateKey, 3, 60 * 60 * 1000);
      const user = allowed && isValidEmail(email) ? await db.get("SELECT * FROM users WHERE email = ? AND status = 'active'", email) : null;
      if (user) {
        const rawToken = randomToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.resetTokenMinutes * 60 * 1000);
        const resetId = tokenHash(rawToken, config.authSecret);
        await transaction(db, async (tx) => {
          await tx.run('DELETE FROM password_resets WHERE user_id = ?', user.id);
          await tx.run('INSERT INTO password_resets (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
            resetId,
            user.id,
            now.toISOString(),
            expiresAt.toISOString(),
          );
        });
        const resetUrl = `${config.appUrl.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;
        try {
          await emailSender({ email: user.email, name: user.name, resetUrl, config, messageId: `password-reset-${resetId}` });
        } catch (error) {
          console.error('Não foi possível enviar o e-mail de recuperação:', error.message);
        }
      }
      return json(res, 200, { message: genericResetMessage });
    }

    if (method === 'POST' && pathname === '/api/auth/reset-password') {
      const body = await readJson(req);
      const validation = passwordErrors(body.password);
      if (!body.token || validation.length || body.password !== body.passwordConfirmation) {
        return json(res, 400, {
          message: validation[0] || (body.password !== body.passwordConfirmation ? 'As senhas não coincidem.' : 'Link de recuperação inválido ou expirado.'),
        });
      }
      const reset = await db.get(`
        SELECT pr.*, u.password_hash FROM password_resets pr
        JOIN users u ON u.id = pr.user_id
        WHERE pr.id = ? AND pr.used_at IS NULL AND pr.expires_at > ? AND u.status = 'active'
      `, tokenHash(String(body.token), config.authSecret), new Date().toISOString());
      if (!reset) return json(res, 400, { message: 'Link de recuperação inválido ou expirado.' });
      if (await bcrypt.compare(body.password, reset.password_hash)) {
        return json(res, 400, { message: 'A nova senha deve ser diferente da senha atual.' });
      }
      const passwordHash = await bcrypt.hash(body.password, 12);
      const now = new Date().toISOString();
      await transaction(db, async (tx) => {
        await tx.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', passwordHash, now, reset.user_id);
        await tx.run('UPDATE password_resets SET used_at = ? WHERE id = ?', now, reset.id);
        await tx.run('DELETE FROM sessions WHERE user_id = ?', reset.user_id);
      });
      return json(res, 200, { message: 'Senha redefinida com sucesso.' });
    }

    if (method === 'PUT' && pathname === '/api/account') {
      const user = await requireUser(db, req, res, config.authSecret);
      if (!user) return;
      const body = await readJson(req);
      const name = normalizeName(body.name);
      const phone = normalizePhone(body.phone);
      const email = normalizeEmail(body.email);
      const errors = {};
      if (!isValidFullName(name)) errors.name = 'Informe seu nome completo.';
      if (!isValidBrazilianPhone(phone)) errors.phone = 'Informe um telefone brasileiro válido.';
      if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.';
      if (Object.keys(errors).length) return json(res, 400, { message: 'Revise os campos destacados.', errors });
      const emailChanged = email !== user.email;
      if (emailChanged) {
        const current = await db.get('SELECT password_hash FROM users WHERE id = ?', user.id);
        if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, current.password_hash))) {
          return json(res, 400, { message: 'Informe sua senha atual para alterar o e-mail.', errors: { currentPassword: 'Senha atual inválida.' } });
        }
        if (await db.get('SELECT id FROM users WHERE email = ? AND id <> ?', email, user.id)) {
          return json(res, 409, { message: 'Este e-mail já está em uso.', errors: { email: 'Este e-mail já está em uso.' } });
        }
      }
      const updatedAt = new Date().toISOString();
      await db.run('UPDATE users SET name = ?, phone = ?, email = ?, updated_at = ? WHERE id = ?', name, phone, email, updatedAt, user.id);
      const updated = await db.get('SELECT * FROM users WHERE id = ?', user.id);
      return json(res, 200, { message: 'Dados atualizados com sucesso.', user: publicUser(updated) });
    }

    if (method === 'POST' && pathname === '/api/account/change-password') {
      const user = await requireUser(db, req, res, config.authSecret);
      if (!user) return;
      const body = await readJson(req);
      const validation = passwordErrors(body.newPassword);
      if (validation.length) return json(res, 400, { message: validation[0] });
      if (body.newPassword !== body.passwordConfirmation) return json(res, 400, { message: 'As senhas não coincidem.' });
      const current = await db.get('SELECT password_hash FROM users WHERE id = ?', user.id);
      if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, current.password_hash))) {
        return json(res, 400, { message: 'Senha atual inválida.' });
      }
      if (await bcrypt.compare(body.newPassword, current.password_hash)) {
        return json(res, 400, { message: 'A nova senha deve ser diferente da senha atual.' });
      }
      const passwordHash = await bcrypt.hash(body.newPassword, 12);
      const updatedAt = new Date().toISOString();
      await transaction(db, async (tx) => {
        await tx.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', passwordHash, updatedAt, user.id);
        await tx.run('DELETE FROM sessions WHERE user_id = ? AND id <> ?', user.id, user.sessionId);
      });
      return json(res, 200, { message: 'Senha alterada com sucesso.' });
    }

    if (method === 'GET' && pathname === '/api/admin/users') {
      const admin = await requireUser(db, req, res, config.authSecret, ['admin']);
      if (!admin) return;
      const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
      const role = url.searchParams.get('role');
      const status = url.searchParams.get('status');
      const clauses = [];
      const parameters = [];
      if (search) {
        const pattern = `%${search}%`;
        const phoneSearch = search.replace(/\D/g, '');
        if (phoneSearch.length >= 2) {
          clauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
          parameters.push(pattern, pattern, `%${phoneSearch}%`);
        } else {
          clauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)');
          parameters.push(pattern, pattern);
        }
      }
      if (role === 'admin' || role === 'agent') {
        clauses.push('role = ?');
        parameters.push(role);
      }
      if (status === 'active' || status === 'blocked') {
        clauses.push('status = ?');
        parameters.push(status);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const rows = await db.all(`SELECT * FROM users ${where} ORDER BY created_at DESC`, ...parameters);
      return json(res, 200, { users: rows.map(publicUser) });
    }

    const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (method === 'PATCH' && adminUserMatch) {
      const admin = await requireUser(db, req, res, config.authSecret, ['admin']);
      if (!admin) return;
      const targetId = decodeURIComponent(adminUserMatch[1]);
      const target = await db.get('SELECT * FROM users WHERE id = ?', targetId);
      if (!target) return json(res, 404, { message: 'Usuário não encontrado.' });
      const body = await readJson(req);
      const nextRole = body.role === undefined ? target.role : body.role;
      const nextStatus = body.status === undefined ? target.status : body.status;
      if (!['admin', 'agent'].includes(nextRole) || !['active', 'blocked'].includes(nextStatus)) {
        return json(res, 400, { message: 'Perfil ou status inválido.' });
      }
      const removesOwnActiveAdmin =
        target.id === admin.id && target.role === 'admin' && target.status === 'active' && (nextRole !== 'admin' || nextStatus !== 'active');
      if (removesOwnActiveAdmin) {
        const activeAdmins = Number((await db.get("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'")).total);
        if (activeAdmins <= 1) {
          return json(res, 409, { message: 'O único administrador ativo não pode remover o próprio acesso administrativo.' });
        }
      }
      const updatedAt = new Date().toISOString();
      await transaction(db, async (tx) => {
        await tx.run('UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?', nextRole, nextStatus, updatedAt, target.id);
        if (nextStatus === 'blocked') await tx.run('DELETE FROM sessions WHERE user_id = ?', target.id);
      });
      const updated = await db.get('SELECT * FROM users WHERE id = ?', target.id);
      return json(res, 200, { message: 'Usuário atualizado com sucesso.', user: publicUser(updated) });
    }

    if (pathname.startsWith('/api/')) return json(res, 404, { message: 'Endpoint não encontrado.' });
    if ((method === 'GET' || method === 'HEAD') && pathname === '/') {
      res.writeHead(302, { Location: '/calculadora', 'Cache-Control': 'no-store' });
      return res.end();
    }
    if ((method === 'GET' || method === 'HEAD') && ['/calculadora', '/minha-conta', '/alterar-senha', '/admin'].includes(pathname)) {
      const protectedUser = await sessionUser(db, req, config.authSecret);
      if (!protectedUser) {
        const hadSession = Boolean(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
        res.writeHead(302, { Location: hadSession ? '/login?reason=session-expired' : '/login', 'Cache-Control': 'no-store' });
        return res.end();
      }
      if (pathname === '/admin' && protectedUser.role !== 'admin') {
        res.writeHead(302, { Location: '/calculadora', 'Cache-Control': 'no-store' });
        return res.end();
      }
    }
    if ((method === 'GET' || method === 'HEAD') && serveStatic(req, res, path.resolve(process.cwd(), 'dist'))) return;
    json(res, 404, { message: 'Página não encontrada.' });
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error('Erro interno:', error);
    json(res, status, { message: status >= 500 ? 'Não foi possível concluir a solicitação.' : error.message });
  }
};
