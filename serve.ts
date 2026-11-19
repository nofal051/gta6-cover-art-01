// A tiny static server for app/ (Node 22, standard library only), so the
// entry can be tried locally without a build step:
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 8123
// It sends the MIME types an offline web app needs, refuses any path that
// climbs out of app/, and otherwise does nothing clever: this is a
// development convenience, not a web server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
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
  const rawPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const target = resolve(join(root, normalize(rawPath).replace(/^(\.\.[/\\])+/, '')));
  if (target !== root && !target.startsWith(root + sep)) {
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
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Vice Nights Cover Press on http://localhost:${port}`);
});
