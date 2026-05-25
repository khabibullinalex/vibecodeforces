export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, contact } = await req.json();

  if (!name || !contact) {
    return new Response(JSON.stringify({ error: 'Заполни имя и контакт' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors = [];

  // ── Telegram ────────────────────────────────────────────────
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    const text = `⚡ <b>Новая заявка — VibeCodeForces</b>\n\n👤 <b>Имя:</b> ${name}\n📬 <b>Контакт:</b> ${contact}`;
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });
    if (!tgRes.ok) errors.push('telegram');
  }

  // ── Email via Resend ─────────────────────────────────────────
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL       = process.env.TO_EMAIL || 'alexey.khabibullin@gmail.com';

  if (RESEND_API_KEY) {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VibeCodeForces <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `⚡ Новая заявка от ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0D1117;color:#E8EAF0;border-radius:16px">
            <h2 style="margin:0 0 24px;color:#F5A623">⚡ Новая заявка</h2>
            <p style="margin:0 0 8px"><b style="color:#7A8499">Имя:</b> ${name}</p>
            <p style="margin:0 0 8px"><b style="color:#7A8499">Контакт:</b> ${contact}</p>
            <hr style="border:none;border-top:1px solid #1B2435;margin:24px 0"/>
            <p style="margin:0;color:#7A8499;font-size:13px">vibecodeforces.ru</p>
          </div>`,
      }),
    });
    if (!emailRes.ok) errors.push('email');
  }

  return new Response(JSON.stringify({ ok: true, errors }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
