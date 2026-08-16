let handlerPromise;

const createHandler = async () => {
  const [{ createRequestHandler }, { config }, databaseModule] = await Promise.all([
    import('../server/app.mjs'),
    import('../server/config.mjs'),
    import('../server/database.mjs'),
  ]);
  const db = await databaseModule.createDatabase(config.databaseUrl);
  await databaseModule.bootstrapAdmin(db);
  await databaseModule.cleanupExpiredRecords(db);
  return createRequestHandler({ db, config });
};

const publicInitializationCode = (error) => {
  const message = String(error?.message || '');
  if (message.includes('AUTH_SECRET')) return 'AUTH_SECRET_MISSING';
  if (message.includes('APP_URL')) return 'APP_URL_INVALID';
  if (error?.code === '28P01') return 'DATABASE_AUTH_FAILED';
  if (error?.code === '3D000') return 'DATABASE_NOT_FOUND';
  if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error?.code)) return 'DATABASE_UNREACHABLE';
  if (['EACCES', 'EROFS', 'SQLITE_CANTOPEN'].includes(error?.code)) return 'DATABASE_URL_INVALID';
  return 'BACKEND_INIT_FAILED';
};

export default async function handler(req, res) {
  const rewrittenUrl = new URL(req.url, 'http://localhost');
  const forwardedPath = rewrittenUrl.searchParams.get('__path');

  if (forwardedPath) {
    rewrittenUrl.searchParams.delete('__path');
    const query = rewrittenUrl.searchParams.toString();
    req.url = `/api/${forwardedPath}${query ? `?${query}` : ''}`;
  }

  try {
    handlerPromise ||= createHandler();
    return (await handlerPromise)(req, res);
  } catch (error) {
    handlerPromise = null;
    const code = publicInitializationCode(error);
    console.error('Falha ao inicializar a API:', { code, errorCode: error?.code, message: error?.message });
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ status: 'unavailable', code }));
  }
}
