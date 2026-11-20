// Vice Nights Cover Press — tiny static server for app/.
// Node 22 standard library only. Serves app/ on port 8080 by default
// (`node serve.ts --port 8080`), then open http://localhost:8080.
// Refuses any path that would escape the app/ folder.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, extname, normalize } from "node:path";

const root = resolve(import.meta.dirname, "app");

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
};

function portFromArgs() {
  const flag = process.argv.indexOf("--port");
  if (flag >= 0 && process.argv[flag + 1]) {
    const n = Number(process.argv[flag + 1]);
    if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  }
  return 8080;
}

const port = portFromArgs();

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const target = resolve(join(root, normalize(rel)));
  if (!target.startsWith(root + "/") && target !== root) {
    res.writeHead(403, { "content-type": "text/plain" });
    res.end("Forbidden\n");
    return;
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found\n");
    return;
  }
  const mime = mimeByExt[extname(target).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "content-type": mime });
  res.end(readFileSync(target));
});

server.listen(port, () => {
  console.log(`Vice Nights Cover Press serving app/ at http://localhost:${port}`);
});
