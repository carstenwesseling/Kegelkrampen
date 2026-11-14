// Minimaler Webserver ohne Abhängigkeiten: liefert die statische App (index.html, css, js, img, dokumente) aus.
// Start: `npm start` (Port aus der Umgebungsvariable PORT, sonst 3000). Backend bleibt Firebase (js/config.js).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
// Nur diese Einträge sind öffentlich (kein Zugriff auf .git, docs, Regeln, server.js usw.).
const PUBLIC = new Set(['index.html', 'css', 'js', 'img', 'dokumente']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch (e) { res.writeHead(400); return res.end('Bad request'); }
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const top = path.relative(ROOT, file).split(path.sep)[0];
  if (!file.startsWith(ROOT + path.sep) || !PUBLIC.has(top)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Nicht gefunden');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Nicht gefunden');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(PORT, () => console.log('Kegelkrampen läuft auf Port ' + PORT));
