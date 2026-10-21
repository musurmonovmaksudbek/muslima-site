'use strict';
/* ====== 16 BOB ====== */
const CHAPTERS = [
  { g:'🌹', k:'1-bob', t:'Muslima', l:['Bu sahifa faqat sen uchun.','Har bir so\'z yurakdan yozildi.','Tayyor bo\'lsang — boshlaymiz.'] },
  { g:'✨', k:'2-bob', t:'Biz uchrashgan kun', l:['Ba\'zi kunlar oddiy boshlanadi,','lekin butun hayotni o\'zgartirib yuboradi.','Mening o\'sha kunim — seni topgan kunim.'] },
  { g:'🌸', k:'3-bob', t:'Tabassuming', l:['Sen kulganingda dunyo yumshoqroq bo\'lib qoladi.','Charchoq ham, tashvish ham ortda qoladi.','<em>Shu tabassum uchun hamma narsaga arziydi.</em>'] },
  { g:'💫', k:'4-bob', t:'Ko\'zlaring', l:['Ularda tinchlik bor, mehr bor,','va men yo\'qotib qo\'ygan uyim bor.','Bir qarashing — eng chiroyli she\'rdan kuchli.'] },
  { g:'🎶', k:'5-bob', t:'Ovozing', l:['Ismimni aytganingda u boshqacha jaranglaydi.','Eng tinch kuy — sening ovozing.','Uni eshitgan kunim yaxshi o\'tadi.'] },
  { g:'🌅', k:'6-bob', t:'Sen bilan kunlarim', l:['Ertalabki choy ham, kechki suhbat ham —','sen bor joyda oddiy narsa ham sehrli.','Har kunim senga rahmat bilan boshlanadi.'] },
  { g:'🍃', k:'7-bob', t:'Kichik narsalar', l:['Qo\'lingdan tutgan onlarim,','birga kulgan jimjit daqiqalarim —','katta baxt aynan shu mayda lahzalardan iborat.'] },
  { g:'🕊️', k:'8-bob', t:'Sabring', l:['Meni tushunding, kechirding, kutding.','Sabring — men uchun eng katta sovg\'a.','Buning uchun mening minnatdorchiligim cheksiz.'] },
  { g:'🌧️', k:'9-bob', t:'Qiyin kunlar', l:['Hamma kun ham quyoshli emas edi.','Lekin yomg\'irdan keyin gullar ochiladi.','Sen bilan har qanday qiyinchilik yengilroq.'] },
  { g:'🏡', k:'10-bob', t:'Oilamiz', l:['Men uchun uy — devor emas,','sen va yuragimizdagi iliqlik.','Birga qurgan oilamiz — eng katta boyligim.'] },
  { g:'🌠', k:'11-bob', t:'Orzularimiz', l:['Yulduzlarga qarab orzu qilganimizda,','hammasida sen bor edingki.','Ularni birga ushaltiramiz, insha\'Alloh.'] },
  { g:'🙏', k:'12-bob', t:'Rahmat', video:'video.mp4', l:['Mehring uchun. Ishonching uchun.','Meni men bo\'lganim uchun qabul qilganing uchun.','Rahmat, Muslima.'] },
  { g:'💍', k:'13-bob', t:'Va\'dalarim', l:['Seni asrayman, qadrlayman.','Dardingga sherik, xursandchiligingga hamroh bo\'laman.','<em>Bu so\'zlarim — chin yurakdan.</em>'] },
  { g:'🌌', k:'14-bob', t:'Kelajak', l:['Oldinda ko\'p yillar bor —','birga kuladigan, birga o\'sadigan yillar.','Men hammasiga tayyorman, chunki yonimda sen borsan.'] },
  { g:'💖', k:'15-bob', t:'Eng muhim so\'z', l:['Seni sevaman.','Kecha ham, bugun ham, ertaga ham.','Va har kuni yana ko\'proq.'] },
  { g:'💌', k:'16-bob', t:'Menga yoz', form:true, l:['Endi navbat sendan.','Yuragingdagini yoz — xabaring to\'g\'ridan-to\'g\'ri menga yetib keladi.'] },
];

const $ = (s) => document.querySelector(s);
const stage = $('#stage'), dots = $('#dots'), bar = $('#bar');
$('#tot').textContent = CHAPTERS.length;
let cur = 0, busy = false;

CHAPTERS.forEach((c, i) => {
  const sec = document.createElement('section');
  sec.className = 'chapter'; sec.dataset.i = i;
  let n = 0;
  sec.innerHTML =
    `<div class="glyph rv" style="--i:${n++}">${c.g}</div>` +
    `<div class="kicker rv" style="--i:${n++}">${c.k}</div>` +
    `<h2 class="rv" style="--i:${n++}">${c.t}</h2>` +
    c.l.map((x) => `<p class="rv" style="--i:${n++}">${x}</p>`).join('') +
    (c.video ? `<div class="vwrap rv" style="--i:${n++}"><video class="cvideo" src="${c.video}" playsinline preload="auto" controls controlslist="nodownload"></video></div>` : '') +
    (c.form ? `<form class="form rv" id="msgForm" style="--i:${n++}" novalidate>
      <label for="fName">Ism</label>
      <input id="fName" name="name" value="Muslima" maxlength="40" autocomplete="off">
      <label for="fMsg">Xabaring</label>
      <textarea id="fMsg" name="message" maxlength="2000" placeholder="Yuragingdagi so'zlarni shu yerga yoz..."></textarea>
      <div class="row"><span class="cc" id="cc">0 / 2000</span></div>
      <button class="send" id="send" type="submit">Menga yuborish ❤️</button>
      <div class="status" id="status" role="status"></div>
    </form>` : '');
  stage.appendChild(sec);
  const d = document.createElement('button');
  d.setAttribute('aria-label', `${i + 1}-bob`);
  d.onclick = () => go(i);
  dots.appendChild(d);
});

function go(to) {
  if (busy || to === cur || to < 0 || to >= CHAPTERS.length) return;
  busy = true;
  const old = stage.children[cur], nu = stage.children[to];
  old.classList.remove('active'); old.classList.add('out'); onHide(old);
  setTimeout(() => {
    old.classList.remove('out');
    nu.scrollTop = 0; nu.classList.add('active');
    cur = to; render(); busy = false; onShow(nu); 
  }, 480);
  burst(3);
}
function render() {
  $('#cur').textContent = cur + 1;
  bar.style.width = ((cur + 1) / CHAPTERS.length * 100) + '%';
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
  $('#prev').disabled = cur === 0; $('#next').disabled = cur === CHAPTERS.length - 1;
}
stage.children[0].classList.add('active'); render();
/* 12-bob videosi: bob ochilganda avtomatik boshlanadi, musiqa vaqtincha pauza bo'ladi */
function onShow(sec) {
  const v = sec.querySelector('video'); if (!v) return;
  v.currentTime = 0; v.muted = false;
  music.duck();
  const p = v.play();
  if (p && p.catch) p.catch(() => { /* brauzer avtomatik ijroni to'xtatdi — foydalanuvchi o'zi ▶ bosadi */ });
}
function onHide(sec) {
  const v = sec.querySelector('video'); if (!v) return;
  v.pause(); music.restore();
}
document.querySelectorAll('video.cvideo').forEach((v) => {
  v.addEventListener('ended', () => music.restore());
  v.addEventListener('play', () => music.duck());
  v.addEventListener('pause', () => { if (v.ended || !v.closest('.chapter.active')) return; music.restore(); });
});
$('#prev').onclick = () => go(cur - 1);
$('#next').onclick = () => go(cur + 1);
addEventListener('keydown', (e) => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight' || e.key === ' ') go(cur + 1);
  if (e.key === 'ArrowLeft') go(cur - 1);
});
let sx = null;
addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => {
  if (sx == null || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const dx = e.changedTouches[0].clientX - sx; sx = null;
  if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ====== MUSIQA: bitta Audio, 01:48 dan boshlanadi, boblar almashganda qayta boshlanmaydi ====== */
const MUSIC_SRC = 'music.mp3';
const MUSIC_START = 108; // 01:48
const music = (() => {
  const a = new Audio(); // YAGONA instance
  a.src = MUSIC_SRC; a.preload = 'auto'; a.loop = false; a.setAttribute('playsinline', '');
  let seeked = false, userPaused = false, ducked = false;
  const box = $('#music'), pBtn = $('#mPlay'), mBtn = $('#mMute'), enable = $('#enableMusic');
  const seek = () => { if (!seeked && a.readyState >= 1) { try { a.currentTime = MUSIC_START; seeked = true; } catch (_) {} } };
  a.addEventListener('loadedmetadata', seek);
  a.addEventListener('ended', () => { a.currentTime = MUSIC_START; if (!userPaused) a.play().catch(() => {}); });
  const ui = () => {
    box.classList.toggle('playing', !a.paused);
    box.classList.toggle('muted', a.muted);
    pBtn.textContent = a.paused ? '▶' : '❚❚';
  };
  ['play', 'pause', 'volumechange'].forEach((ev) => a.addEventListener(ev, ui));
  async function tryPlay() {
    if (ducked) return false;
    seek();
    try { await a.play(); enable.hidden = true; return true; }
    catch (_) { if (!userPaused) enable.hidden = false; return false; }
  }
  // 1) sahifa ochilganda avtomatik urinish (brauzer bloklashi mumkin — kafolat yo'q)
  tryPlay();
  // 2) bloklansa — birinchi harakatdan keyin qayta urinish
  const retry = async () => {
    if (userPaused) return;
    if (await tryPlay()) ['pointerdown', 'keydown', 'touchend', 'click'].forEach((e) => removeEventListener(e, retry, true));
  };
  ['pointerdown', 'keydown', 'touchend', 'click'].forEach((e) => addEventListener(e, retry, true));
  enable.onclick = (e) => { e.stopPropagation(); userPaused = false; tryPlay(); };
  pBtn.onclick = (e) => {
    e.stopPropagation();
    if (a.paused) { userPaused = false; tryPlay(); } else { userPaused = true; a.pause(); }
  };
  mBtn.onclick = (e) => { e.stopPropagation(); a.muted = !a.muted; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !userPaused && a.paused) tryPlay(); });
  a.duck = () => { ducked = true; a.pause(); enable.hidden = true; };
  a.restore = () => { ducked = false; if (!userPaused) tryPlay(); };
  ui();
  return a;
})();

/* ====== GUL BARGLARI (canvas) ====== */
const cv = $('#petals'), cx = cv.getContext('2d');
let W, H, petals = [];
const dpr = Math.min(devicePixelRatio || 1, 2);
function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
addEventListener('resize', size); size();
const COLORS = ['#ff6b9a', '#ff9ec0', '#ffc2d6', '#f2cf8e', '#ff4f86'];
const mk = (fromTop = false) => ({ x: Math.random() * W, y: fromTop ? -20 : Math.random() * H, r: 5 + Math.random() * 9, vy: .4 + Math.random() * 1, vx: -.3 + Math.random() * .6, rot: Math.random() * 6, vr: -.03 + Math.random() * .06, sw: Math.random() * 6, c: COLORS[Math.random() * COLORS.length | 0], a: .35 + Math.random() * .5 });
const count = Math.min(46, Math.round(W / 24));
for (let i = 0; i < count; i++) petals.push(mk());
function frame() {
  cx.clearRect(0, 0, W, H);
  for (const p of petals) {
    p.sw += .02; p.y += p.vy; p.x += p.vx + Math.sin(p.sw) * .6; p.rot += p.vr;
    if (p.y > H + 20) Object.assign(p, mk(true));
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = p.a; cx.fillStyle = p.c;
    cx.beginPath(); cx.moveTo(0, -p.r); cx.bezierCurveTo(p.r, -p.r * .6, p.r * .8, p.r, 0, p.r * .9); cx.bezierCurveTo(-p.r * .8, p.r, -p.r, -p.r * .6, 0, -p.r); cx.fill(); cx.restore();
  }
  requestAnimationFrame(frame);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) frame();

function burst(n = 8, ox = innerWidth / 2, oy = innerHeight * .55) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span'); h.className = 'heart-burst';
    h.textContent = ['💖', '🌸', '💗', '✨'][i % 4];
    h.style.left = ox + 'px'; h.style.top = oy + 'px';
    h.style.setProperty('--x', (Math.random() * 260 - 130) + 'px');
    h.style.setProperty('--y', (-80 - Math.random() * 220) + 'px');
    document.body.appendChild(h); setTimeout(() => h.remove(), 1500);
  }
}
addEventListener('pointerdown', (e) => { if (e.target.closest('button,input,textarea')) return; burst(5, e.clientX, e.clientY); });

/* ====== XABAR FORMASI ====== */
const form = $('#msgForm'), msg = $('#fMsg'), nameI = $('#fName'), cc = $('#cc'), send = $('#send'), status = $('#status');
const MAX = 2000;
let sending = false;
const setStatus = (t, c = '') => { status.textContent = t; status.className = 'status ' + c; };
msg.addEventListener('input', () => { cc.textContent = `${msg.value.length} / ${MAX}`; cc.classList.toggle('warn', msg.value.length > MAX * .9); setStatus(''); });
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (sending) return; // ikki marta yuborishdan himoya
  const text = msg.value.trim();
  if (!text) { setStatus('Iltimos, avval xabar yozing 💭', 'err'); msg.focus(); return; }
  if (text.length > MAX) { setStatus(`Xabar ${MAX} belgidan oshmasin.`, 'err'); return; }
  sending = true; send.disabled = true; send.textContent = 'Yuborilmoqda...'; setStatus('');
  try {
    const r = await fetch('/api/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameI.value.trim() || 'Muslima', message: text }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.ok === true) {
      setStatus('Xabaring yetib bordi ❤️ Rahmat, Muslima!', 'ok');
      msg.value = ''; cc.textContent = `0 / ${MAX}`;
      const b = send.getBoundingClientRect(); burst(14, b.left + b.width / 2, b.top);
    } else {
      setStatus((d && d.error) || 'Xabar yuborilmadi. Qayta urinib ko\'ring.', 'err');
    }
  } catch (_) {
    setStatus('Internetga ulanib bo\'lmadi. Xabaring saqlanib turibdi — qayta urinib ko\'ring.', 'err');
  } finally { sending = false; send.disabled = false; send.textContent = 'Menga yuborish ❤️'; }
});
