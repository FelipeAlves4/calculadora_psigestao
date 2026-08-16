import { createHash, createHmac, randomBytes } from 'node:crypto';

export const randomToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token, secret) => createHmac('sha256', secret).update(token).digest('hex');
export const privacyHash = (value) => createHash('sha256').update(String(value)).digest('hex');

export const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        return separator === -1
          ? [part, '']
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      }),
  );

export const cookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Strict'}`);
  return parts.join('; ');
};

export const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
};
