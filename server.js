'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

// .env ni (agar bor bo'lsa) qo'lda o'qiymiz — qo'shimcha kutubxonasiz.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (_) { /* .env yo'q — muhit o'zgaruvchilari hosting paneldan keladi */ }

const PUBLIC = path.join(__dirname, 'public');
const MAX_NAME = 40;
const MAX_MESSAGE = 2000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

const hits = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k); }, RATE_WINDOW_MS).unref();

function tashkentTime(d = new Date()) {
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d) + ' (Toshkent)';
}

function buildText(name, message) {
  return `💌 YANGI XABAR — MUSLIMA\n\n👸 Ism: ${name}\n\n💬 Xabar:\n${message}\n\n🕒 Vaqt: ${tashkentTime()}`;
}

function json(res, status, obj, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, status: 503, error: 'Server hali sozlanmagan.' };
  const base = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(`${base}/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: ctrl.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.ok === true) return { ok: true };
    console.error('Telegram rad etdi: HTTP', r.status, data.description || ''); // token logga chiqmaydi
    return { ok: false, status: 502, error: 'Telegram xabarni qabul qilmadi.' };
  } catch (e) {
    console.error('Telegramga ulanishda xato:', e.name);
    return { ok: false, status: 502, error: 'Telegramga ulanib bo\'lmadi.' };
  } finally { clearTimeout(timer); }
}

async function handleMessage(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'Juda ko\'p urinish. Birozdan keyin qayta urinib ko\'ring.' }, { 'Retry-After': '600' });
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return json(res, e.code === 413 ? 413 : 400, { ok: false, error: 'Noto\'g\'ri so\'rov.' }); }
  const name = String(body.name == null ? 'Muslima' : body.name).trim().slice(0, MAX_NAME) || 'Muslima';
  const message = typeof body.message === 'string' ? body.message.replace(/\r\n/g, '\n').trim() : '';
  if (!message) return json(res, 400, { ok: false, error: 'Xabar bo\'sh bo\'lishi mumkin emas.' });
  if (message.length > MAX_MESSAGE) return json(res, 400, { ok: false, error: `Xabar ${MAX_MESSAGE} belgidan oshmasin.` });
  const result = await sendToTelegram(buildText(name, message));
  if (!result.ok) return json(res, result.status, { ok: false, error: result.error });
  return json(res, 200, { ok: true });
}

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Topilmadi'); }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' };
    const range = req.headers.range;
    if (range && /^(audio|video)\//.test(type)) { // audio/video seek (01:48 dan boshlash, iOS) uchun
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m && m[1] ? parseInt(m[1], 10) : 0;
      const end = m && m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Length': st.size, 'Cache-Control': /^(audio|video)/.test(type) ? 'public, max-age=86400' : 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/message') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Faqat POST.' }, { Allow: 'POST' });
    return handleMessage(req, res).catch((e) => { console.error('Ichki xato:', e.message); json(res, 500, { ok: false, error: 'Ichki xato.' }); });
  }
  if (url.pathname === '/healthz') return json(res, 200, { ok: true });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Sayt: http://localhost:${port}`));
}
module.exports = { server, buildText };
