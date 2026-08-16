import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const viteEntry = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const serverEnvironment = {
  ...process.env,
  NODE_ENV: 'development',
  APP_URL: 'http://localhost:5173',
  DATABASE_URL: process.env.LOCAL_DATABASE_URL || './data/asex.db',
};
const children = [
  spawn(process.execPath, ['--watch', 'server/index.mjs'], { stdio: 'inherit', env: serverEnvironment }),
  spawn(process.execPath, [viteEntry], { stdio: 'inherit' }),
];

const stop = () => {
  for (const child of children) child.kill();
};

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code;
    stop();
  });
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
