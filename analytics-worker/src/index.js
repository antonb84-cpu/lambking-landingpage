const TARGET_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

function berlinDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function mondayOf(day) {
  const date = new Date(`${day}T12:00:00Z`)
  const distance = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - distance)
  return date.toISOString().slice(0, 10)
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
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store', ...headers },
  })
}

function authorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || '')
  const supplied = request.headers.get('Authorization') || ''
  if (!expected || !supplied.startsWith('Bearer ')) return false
  const actual = supplied.slice(7)
  if (actual.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < actual.length; index += 1) {
    mismatch |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return mismatch === 0
}

async function recordEvent(request, env, origin) {
  const length = Number(request.headers.get('Content-Length') || 0)
  if (length > 512) return json({ ok: false, error: 'Payload too large' }, 413, corsHeaders(origin))

  let payload
  try {
    payload = JSON.parse(await request.text())
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400, corsHeaders(origin))
  }

  const event = payload?.event
  const target = event === 'amazon_click' ? String(payload?.target || '') : ''
  if (!['pageview', 'amazon_click'].includes(event) || (event === 'amazon_click' && !TARGET_PATTERN.test(target))) {
    return json({ ok: false, error: 'Invalid event' }, 400, corsHeaders(origin))
  }

  await env.DB.prepare(
    `INSERT INTO daily_counts (day, event_type, target_id, count)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(day, event_type, target_id)
     DO UPDATE SET count = count + 1`,
  ).bind(berlinDay(), event, target).run()

  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

async function readStats(env) {
  const today = berlinDay()
  const weekStart = mondayOf(today)
  const result = await env.DB.prepare(
    `SELECT event_type, target_id,
            SUM(CASE WHEN day = ? THEN count ELSE 0 END) AS today_count,
            SUM(CASE WHEN day BETWEEN ? AND ? THEN count ELSE 0 END) AS week_count,
            SUM(count) AS total_count
       FROM daily_counts
      GROUP BY event_type, target_id
      ORDER BY total_count DESC`,
  ).bind(today, weekStart, today).all()

  const pageviews = { today: 0, week: 0, total: 0 }
  const amazonClicks = []
  for (const row of result.results || []) {
    const values = {
      today: Number(row.today_count || 0),
      week: Number(row.week_count || 0),
      total: Number(row.total_count || 0),
    }
    if (row.event_type === 'pageview') Object.assign(pageviews, values)
    if (row.event_type === 'amazon_click') amazonClicks.push({ bookId: row.target_id, ...values })
  }
  return { pageviews, amazonClicks, period: { today, weekStart, timeZone: 'Europe/Berlin' } }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/event') {
      const origin = allowedOrigin(request, env)
      if (!origin) return json({ ok: false, error: 'Origin not allowed' }, 403)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, corsHeaders(origin))
      return recordEvent(request, env, origin)
    }
    if (url.pathname === '/stats') {
      if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405)
      if (!authorized(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401)
      return json({ ok: true, ...(await readStats(env)) })
    }
    if (url.pathname === '/health') return json({ ok: true })
    return json({ ok: false, error: 'Not found' }, 404)
  },
}

export { berlinDay, mondayOf }
