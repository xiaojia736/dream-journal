import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// A small static server for the browser preview; no build or dependencies.
const previewRoot = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '../preview'));
const port = Number(process.env.STARSEA_PREVIEW_PORT || 4827);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('STARSEA_PREVIEW_PORT must be a port number between 1 and 65535.');
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const filePath = resolve(previewRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (filePath !== previewRoot && !filePath.startsWith(previewRoot + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const actualPath = await realpath(filePath);
    if (!actualPath.startsWith(previewRoot + sep) || !(await stat(actualPath)).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const data = await readFile(actualPath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(actualPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Not found');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Open the existing preview or set STARSEA_PREVIEW_PORT.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`StarSea Journal preview: http://127.0.0.1:${port}`);
  console.log('No compilation. Press Ctrl+C to stop.');
});
