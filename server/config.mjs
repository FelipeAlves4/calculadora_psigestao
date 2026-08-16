import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const configuredDatabase = process.env.DATABASE_URL || './data/asex.db';

if (isProduction && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET é obrigatório em produção.');
}

if (isProduction && (!process.env.APP_URL || !process.env.APP_URL.startsWith('https://'))) {
  throw new Error('APP_URL com HTTPS é obrigatório em produção.');
}

export const config = {
  port: Number(process.env.PORT || 8787),
  isProduction,
  databaseUrl: /^postgres(ql)?:\/\//i.test(configuredDatabase)
    ? configuredDatabase
    : configuredDatabase === ':memory:'
      ? ':memory:'
      : path.resolve(process.cwd(), configuredDatabase),
  appUrl: process.env.APP_URL || (isProduction ? '' : 'http://localhost:5173'),
  emailFrom: process.env.EMAIL_FROM || '',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  authSecret: process.env.AUTH_SECRET || 'development-only-change-before-production',
  sessionHours: 12,
  rememberedSessionDays: 30,
  resetTokenMinutes: 30,
};
