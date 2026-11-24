// Zero-dependency static server for the demo.
// Serves only the ./public folder and also listens on the local network,
// so a phone on the same Wi-Fi can open the site (e.g. from a QR code).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = resolve(fileURLToPath(new URL('./public', import.meta.url)));
const START_PORT = Number(process.env.PORT) || 5173;
const MAX_PORT_TRIES = 10;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
};

function resolveSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const target = resolve(PUBLIC_DIR, `.${decoded}`);
  const isInside = target === PUBLIC_DIR || target.startsWith(PUBLIC_DIR + sep);
  return isInside ? target : null;
}

async function findFile(target) {
  const info = await stat(target).catch(() => null);
  if (!info) return null;
  if (info.isDirectory()) return findFile(join(target, 'index.html'));
  return target;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type });
  res.end(body);
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }
  const target = resolveSafePath(req.url || '/');
  if (!target) {
    send(res, 400, 'Bad request');
    return;
  }
  const file = await findFile(target);
  if (!file) {
    send(res, 404, 'Not found');
    return;
  }
  try {
    const body = await readFile(file);
    const type = CONTENT_TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
    send(res, 200, req.method === 'HEAD' ? undefined : body, type);
  } catch (err) {
    console.error(`[server] Failed to read ${file}:`, err.message);
    send(res, 500, 'Internal server error');
  }
}

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
}

// Typical home/university Wi-Fi ranges; other addresses are often VPN adapters.
function isPrivateLan(ip) {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

function printBanner(port) {
  const ips = lanAddresses();
  const phoneLines = [...ips.filter(isPrivateLan), ...ips.filter((ip) => !isPrivateLan(ip))].map((ip) =>
    isPrivateLan(ip)
      ? `  On your phone:      http://${ip}:${port}/#/join   (same Wi-Fi)`
      : `  Other network:      http://${ip}:${port}/#/join   (probably a VPN adapter)`,
  );
  const lines = [
    '',
    '  Not Just One Teacher — demo is running',
    '',
    `  On this computer:   http://localhost:${port}`,
    ...phoneLines,
    '',
    '  Press Ctrl+C to stop.',
    '',
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function listen(port, triesLeft) {
  const server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error('[server] Unexpected error:', err);
      send(res, 500, 'Internal server error');
    });
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && triesLeft > 0) {
      listen(port + 1, triesLeft - 1);
      return;
    }
    console.error(`[server] Could not start: ${err.message}`);
    process.exit(1);
  });
  server.listen(port, '0.0.0.0', () => printBanner(port));
}

listen(START_PORT, MAX_PORT_TRIES);
