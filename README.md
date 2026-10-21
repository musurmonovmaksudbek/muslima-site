# Muslima uchun sayt

16 bobli romantik sayt, fon musiqasi (01:48 dan boshlanadi) va oxirgi bobda Telegram botga xabar yuborish formasi.

## Ishga tushirish
```
cp .env.example .env     # TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID ni yozing (.env GitHub'ga ketmaydi)
npm start                # http://localhost:3000
npm test
```
Kutubxona o'rnatish shart emas (faqat Node 18+).

## Telegram bot
1. @BotFather → `/newbot` → token oling.
2. Botingizga o'zingiz `/start` yozing (bot sizga yoza olishi uchun shart).
3. Chat ID: @userinfobot orqali yoki `https://api.telegram.org/bot<TOKEN>/getUpdates` dagi `chat.id`.
4. Hosting panelida `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni Environment Variables sifatida kiriting.

## Deploy (Render / Railway / Fly.io — Node server kerak)
Render: New → Web Service → GitHub repo → Start Command: `npm start` → Environment'ga 2 ta o'zgaruvchini qo'shing.
Har `git push` avtomatik qayta deploy qiladi. GitHub Pages/Netlify (statik) bu yerda yetmaydi, chunki backend kerak.

## Musiqa
`public/music.mp3`; boshlanish vaqti `public/app.js` ichida `MUSIC_START = 108` (soniya). Brauzerlar (ayniqsa iPhone/Safari) autoplay'ni bloklashi mumkin — shunda "Musiqani yoqish ♫" tugmasi chiqadi.
