// A tiny static server for app/ (Node 22, standard library only), so the
// entry can be tried locally without a build step:
//
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 8123
//
// It sends the MIME types an offline web app needs and refuses any path
// that climbs out of app/. Nothing more: a development convenience, not
// a web server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const flagAt = argv.indexOf('--port');
const wanted = flagAt === -1 ? 8080 : Number(argv[flagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const target = resolve(join(appRoot, normalize(pathname).replace(/^(\.\.[/\\])+/, '')));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let file = target;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Vice Nights Cover Press on http://localhost:${port}`);
});
