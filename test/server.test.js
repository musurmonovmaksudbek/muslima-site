'use strict';
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Soxta Telegram serveri
let tgCalls = [], tgMode = 'ok';
const tg = http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => b += c); req.on('end', () => {
    tgCalls.push({ url: req.url, body: JSON.parse(b) });
    if (tgMode === 'ok') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"description":"Bad Request"}'); }
  });
});

let ipN = 0;
const post = (port, body, raw, ip) => new Promise((resolve, reject) => {
  const data = raw || JSON.stringify(body);
  const r = http.request({ port, path: '/api/message', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'X-Forwarded-For': ip || ('10.0.0.' + (++ipN)) } }, (res) => {
    let o = ''; res.on('data', (c) => o += c); res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(o) }));
  }); r.on('error', reject); r.end(data);
});
const get = (port, p, headers = {}) => new Promise((resolve) => http.get({ port, path: p, headers }, (res) => { let n = 0; res.on('data', (c) => n += c.length); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, n })); }));

(async () => {
  await new Promise((r) => tg.listen(0, r));
  process.env.TELEGRAM_BOT_TOKEN = 'TESTTOKEN123'; process.env.TELEGRAM_CHAT_ID = '777';
  process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${tg.address().port}`;
  const { server } = require('../server.js');
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const ok = (n) => console.log('  ✓', n);

  // 1. bo'sh xabar rad etiladi, Telegramga bormaydi
  let r = await post(port, { name: 'Muslima', message: '   ' });
  assert.strictEqual(r.status, 400); assert.strictEqual(r.json.ok, false); assert.strictEqual(tgCalls.length, 0); ok('bo\'sh xabar rad etildi');
  // 2. uzun xabar
  r = await post(port, { message: 'a'.repeat(2001) });
  assert.strictEqual(r.status, 400); assert.strictEqual(tgCalls.length, 0); ok('2000 belgidan uzun xabar rad etildi');
  // 3. buzuq JSON
  r = await post(port, null, '{bad'); assert.strictEqual(r.status, 400); ok('buzuq JSON → 400');
  // 4. muvaffaqiyat: aniq matn
  const exact = 'Salom!\n  Seni <b>sevaman</b> & "hamisha" 💖';
  r = await post(port, { name: 'Muslima', message: exact });
  assert.strictEqual(r.status, 200); assert.strictEqual(r.json.ok, true);
  const c = tgCalls[0];
  assert.strictEqual(c.url, '/botTESTTOKEN123/sendMessage'); assert.strictEqual(c.body.chat_id, '777');
  assert(c.body.text.startsWith('💌 YANGI XABAR — MUSLIMA\n\n👸 Ism: Muslima\n\n💬 Xabar:\n' + exact + '\n\n🕒 Vaqt: '));
  assert(!c.body.parse_mode); ok('Telegramga aniq xabar yuborildi, muvaffaqiyat qaytdi');
  console.log('    namuna:\n' + c.body.text.split('\n').map((l) => '      ' + l).join('\n'));
  // 5. Telegram rad etsa — muvaffaqiyat YO'Q
  tgMode = 'fail'; r = await post(port, { message: 'sinov' });
  assert.strictEqual(r.status, 502); assert.strictEqual(r.json.ok, false); assert(!JSON.stringify(r.json).includes('TESTTOKEN')); ok('Telegram xatosida success qaytmaydi, token sizmaydi');
  // 6. Telegram umuman erishilmasa
  tg.close(); r = await post(port, { message: 'sinov' }); assert.strictEqual(r.status, 502); assert.strictEqual(r.json.ok, false); ok('Telegramga ulanib bo\'lmasa xato qaytadi');
  // 7. sozlanmagan server
  const t = process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_BOT_TOKEN;
  r = await post(port, { message: 'sinov' }); assert.strictEqual(r.status, 503); process.env.TELEGRAM_BOT_TOKEN = t; ok('token yo\'q bo\'lsa 503');
  // 8. rate limit (5 urinish/10 daqiqa: yuqorida allaqachon 6 ta bo'ldi)
  tgMode = 'ok';
  for (let i = 0; i < 5; i++) assert.notStrictEqual((await post(port, { message: '' }, null, '9.9.9.9')).status, 429);
  r = await post(port, { message: '' }, null, '9.9.9.9'); assert.strictEqual(r.status, 429); ok('rate limit ishlaydi (6-urinishda 429)');
  // 9. statik fayllar + audio range
  assert.strictEqual((await get(port, '/')).status, 200);
  const rg = await get(port, '/music.mp3', { Range: 'bytes=1000000-1000999' });
  assert.strictEqual(rg.status, 206); assert.strictEqual(rg.n, 1000); ok('sayt va musiqa (Range/seek) xizmat qiladi');
  const leak = await get(port, '/..%2fserver.js'); assert([403, 404].includes(leak.status)); ok('papkadan tashqariga chiqib bo\'lmaydi');
  // 10. 16 bob + token frontendda yo'q
  const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.strictEqual((app.match(/k:'\d+-bob'/g) || []).length, 16); ok('frontendda 16 bob bor');
  for (const f of fs.readdirSync(path.join(__dirname, '../public'))) {
    if (f.endsWith('.mp3')) continue;
    const s = fs.readFileSync(path.join(__dirname, '../public', f), 'utf8');
    assert(!/api\.telegram\.org|bot\d{6,}:|TELEGRAM_BOT_TOKEN/.test(s), f + ' da token izi bor');
  } ok('public/ ichida token yoki Telegram URL yo\'q');
  assert(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8').includes('MUSIC_START = 108')); ok('musiqa 01:48 (108s) dan boshlanadi');
  console.log('\nBarcha testlar o\'tdi.'); server.close(); process.exit(0);
})().catch((e) => { console.error('XATO:', e); process.exit(1); });
