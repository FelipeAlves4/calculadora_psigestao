import { createServer } from 'node:http';
import { createRequestHandler } from './app.mjs';
import { config } from './config.mjs';
import { bootstrapAdmin, cleanupExpiredRecords, createDatabase } from './database.mjs';

const db = await createDatabase(config.databaseUrl);
await bootstrapAdmin(db);
await cleanupExpiredRecords(db);
setInterval(() => void cleanupExpiredRecords(db), 60 * 60 * 1000).unref();

const server = createServer(createRequestHandler({ db, config }));
server.listen(config.port, () => {
  console.log(`Servidor ASEX disponível em http://localhost:${config.port}`);
});

const shutdown = () => {
  server.close(() => {
    void db.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
