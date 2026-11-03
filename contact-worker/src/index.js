// LambKing Kontaktformular: nimmt die Nachricht entgegen, prüft sie serverseitig und leitet sie
// ausschließlich per E-Mail (SMTP) weiter. Es gibt keine Datenbank für Nachrichten.
//
// Gespeichert wird nur ein Zähler für das Rate Limiting: Schlüssel = HMAC der IP-Adresse (mit geheimem
// Salt, die Adresse selbst wird nie abgelegt), Wert = Anzahl. Cloudflare KV löscht den Eintrag
// automatisch nach Ablauf der Zeit (expirationTtl).

const LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 4000,
  bodyMaxBytes: 16 * 1024,
}
const RATE = { perIp: 3, windowSeconds: 3600, perDay: 40, dayTtlSeconds: 90000 }

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

// Steuerzeichen (außer Zeilenumbruch/Tab in der Nachricht) und Unicode-Richtungszeichen entfernen
const CONTROL = new RegExp('[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029\u202A-\u202E\u2066-\u2069]', 'g')

export function cleanLine(value, max) {
  return String(value ?? '')
    .replace(CONTROL, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max)
}

export function cleanMessage(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, max)
}

// Prüft und säubert die Eingaben. Liefert { ok: true, value } oder { ok: false, fields: [...] }.
export function validate(input) {
  const data = input && typeof input === 'object' ? input : {}
  const fields = []
  const name = cleanLine(data.name, LIMITS.nameMax)
  const email = cleanLine(data.email, LIMITS.emailMax)
  const message = cleanMessage(data.message, LIMITS.messageMax)
  if (!name) fields.push('name')
  if (!EMAIL_PATTERN.test(email) || email.includes('..') || email.length > LIMITS.emailMax) fields.push('email')
  if (message.length < LIMITS.messageMin) fields.push('message')
  if (data.consent !== true) fields.push('consent')
  if (fields.length) return { ok: false, fields }
  return { ok: true, value: { name, email, message } }
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return allowed.includes(origin) ? origin : ''
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  }
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store', ...headers },
  })
}

async function hashIp(ip, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip)))
  return Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function berlinDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

// Zählt einen Versuch. Das Zeitfenster beginnt mit dem ersten Versuch; der Eintrag läuft danach von selbst ab.
async function takeSlot(kv, key, limit, windowSeconds, now = Date.now()) {
  const raw = await kv.get(key)
  let count = 0
  let start = now
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      count = Number(parsed.c) || 0
      start = Number(parsed.s) || now
    } catch {
      count = 0
    }
  }
  if (count >= limit) return false
  const remaining = Math.max(60, windowSeconds - Math.floor((now - start) / 1000)) // KV: mindestens 60 s
  await kv.put(key, JSON.stringify({ c: count + 1, s: start }), { expirationTtl: remaining })
  return true
}

export function buildMail(value, env) {
  const { name, email, message } = value
  const from = String(env.MAIL_FROM || env.SMTP_USER || '')
  return {
    from: { name: 'LambKing Kontaktformular', email: from },
    to: { email: String(env.MAIL_TO) },
    reply: { name, email },
    subject: `Kontaktformular lambking.store: ${name}`,
    text: [
      'Neue Nachricht über das Kontaktformular auf lambking.store',
      '',
      `Name:   ${name}`,
      `E-Mail: ${email}`,
      '',
      'Nachricht:',
      message,
      '',
      '— Zum Antworten einfach auf diese E-Mail antworten (Reply-To ist die Adresse des Absenders).',
    ].join('\n'),
  }
}

async function sendWithSmtp(env, mail) {
  const { WorkerMailer } = await import('worker-mailer')
  await WorkerMailer.send(
    {
      host: String(env.SMTP_HOST),
      port: Number(env.SMTP_PORT || 465),
      secure: Number(env.SMTP_PORT || 465) === 465,
      startTls: Number(env.SMTP_PORT || 465) !== 465,
      credentials: { username: String(env.SMTP_USER), password: String(env.SMTP_PASS) },
      authType: 'plain',
      socketTimeoutMs: 10000,
      responseTimeoutMs: 10000,
    },
    mail,
  )
}

export async function handleContact(request, env, deps = {}) {
  const sendMail = deps.sendMail || ((mail) => sendWithSmtp(env, mail))
  const origin = allowedOrigin(request, env)
  if (!origin) return json({ ok: false, error: 'origin' }, 403)
  const cors = corsHeaders(origin)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors)

  const length = Number(request.headers.get('Content-Length') || 0)
  if (length > LIMITS.bodyMaxBytes) return json({ ok: false, error: 'too_large' }, 413, cors)
  let text
  try {
    text = await request.text()
  } catch {
    return json({ ok: false, error: 'invalid' }, 400, cors)
  }
  if (text.length > LIMITS.bodyMaxBytes) return json({ ok: false, error: 'too_large' }, 413, cors)
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return json({ ok: false, error: 'invalid' }, 400, cors)
  }

  // Honeypot: ein Mensch sieht das Feld nicht. Bots bekommen eine Erfolgsmeldung, es wird nichts gesendet.
  if (payload && typeof payload === 'object' && String(payload.website ?? '').trim() !== '') {
    return json({ ok: true }, 200, cors)
  }

  const checked = validate(payload)
  if (!checked.ok) return json({ ok: false, error: 'validation', fields: checked.fields }, 422, cors)

  if (!env.RATE || !env.RL_SALT || !env.MAIL_TO || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return json({ ok: false, error: 'not_configured' }, 503, cors)
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const ipKey = `ip:${await hashIp(ip, env.RL_SALT)}`
  if (!(await takeSlot(env.RATE, ipKey, RATE.perIp, RATE.windowSeconds))) return json({ ok: false, error: 'rate_limit' }, 429, { ...cors, 'Retry-After': String(RATE.windowSeconds) })
  if (!(await takeSlot(env.RATE, `day:${berlinDay()}`, RATE.perDay, RATE.dayTtlSeconds))) return json({ ok: false, error: 'busy' }, 429, cors)

  try {
    await sendMail(buildMail(checked.value, env))
  } catch {
    return json({ ok: false, error: 'send_failed' }, 502, cors)
  }
  return json({ ok: true }, 200, cors)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/contact') return handleContact(request, env)
    if (url.pathname === '/health') return json({ ok: true })
    return json({ ok: false, error: 'not_found' }, 404)
  },
}
