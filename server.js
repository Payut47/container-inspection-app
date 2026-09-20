const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[Server] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });

  // Cache control for development
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (e) {
    decodedPath = pathname;
  }

  let safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\' || !safePath) {
    safePath = 'index.html';
  } else {
    safePath = safePath.replace(/^[\/\\]+/, '');
  }

  const filePath = path.join(PUBLIC_DIR, safePath);
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`File not found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Container Inspection App Server is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Storage: browser localStorage (no API or database required)`);
  console.log(`====================================================`);
});
