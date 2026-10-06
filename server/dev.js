// Local development server for the API. With --static it also serves the built SPA
// from dist/ with history fallback, mirroring the Vercel rewrites.
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 3001;
const serveStatic = process.argv.includes('--static');

const app = createApp();

if (serveStatic) {
  const dist = path.join(root, 'dist');
  if (!existsSync(dist)) {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, () => {
  console.log(`HomeStays API listening on http://localhost:${port}/api${serveStatic ? ` (serving app at http://localhost:${port})` : ''}`);
});
