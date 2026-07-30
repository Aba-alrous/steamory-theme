/**
 * Dev-only static server for the visual harness.
 *
 * Salla themes can only be previewed for real through `salla theme preview`,
 * which needs an interactive login and a demo store. This serves the compiled
 * public/ output next to a hand-written page of representative Raed markup so
 * the STEAMORY layer can be checked in a browser after every build.
 *
 * Not part of the theme: nothing here ships to Salla.
 *
 *   node dev-harness/server.js   ->   http://localhost:4700
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4700;
const PUBLIC = path.join(__dirname, '..', 'public');
const HARNESS = path.join(__dirname, 'index.html');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);

    // The harness page itself, everything else out of the build output.
    let file = url === '/' ? HARNESS : path.join(PUBLIC, url);

    // Keep requests inside the two directories we intend to serve.
    if (file !== HARNESS && !path.resolve(file).startsWith(path.resolve(PUBLIC))) {
      res.writeHead(403).end('forbidden');
      return;
    }

    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('not found: ' + url);
        return;
      }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log('harness on http://localhost:' + PORT);
  });
