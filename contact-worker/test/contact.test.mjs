import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMail, cleanLine, handleContact, validate } from '../src/index.js'

class FakeKv {
  constructor() { this.map = new Map(); this.puts = [] }
  async get(key) { return this.map.get(key) ?? null }
  async put(key, value, options) { this.map.set(key, value); this.puts.push({ key, value, options }) }
}

function makeEnv(overrides = {}) {
  return {
    ALLOWED_ORIGINS: 'https://lambking.store',
    MAIL_TO: 'hello@lambking.store',
    MAIL_FROM: 'hello@lambking.store',
    SMTP_HOST: 'smtp.example', SMTP_USER: 'hello@lambking.store', SMTP_PASS: 'x', RL_SALT: 'salt',
    RATE: new FakeKv(),
    ...overrides,
  }
}

const GOOD = { name: 'Maria Muster', email: 'maria@example.com', message: 'Hallo, ich habe eine Frage zu den Malbüchern.', consent: true, website: '' }

function post(body, { origin = 'https://lambking.store', ip = '203.0.113.7', method = 'POST', raw } = {}) {
  return new Request('https://contact.example/contact', {
    method,
    headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': ip },
    body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
  })
}

function collector() {
  const sent = []
  return { sent, sendMail: async (mail) => { sent.push(mail) } }
}

test('gültige Nachricht wird mit Reply-To des Absenders gesendet', async () => {
  const mailer = collector()
  const response = await handleContact(post(GOOD), makeEnv(), mailer)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(mailer.sent.length, 1)
  const mail = mailer.sent[0]
  assert.equal(mail.to.email, 'hello@lambking.store')
  assert.deepEqual(mail.reply, { name: 'Maria Muster', email: 'maria@example.com' })
  assert.equal(mail.from.email, 'hello@lambking.store')
  assert.match(mail.text, /Hallo, ich habe eine Frage/)
})

test('Honeypot: Bot bekommt Erfolg, es wird nichts gesendet oder gespeichert', async () => {
  const mailer = collector()
  const env = makeEnv()
  const response = await handleContact(post({ ...GOOD, website: 'http://spam.example' }), env, mailer)
  assert.equal(response.status, 200)
  assert.equal(mailer.sent.length, 0)
  assert.equal(env.RATE.puts.length, 0)
})

test('Pflichtfelder und Einwilligung werden serverseitig geprüft', async () => {
  const mailer = collector()
  for (const bad of [{ ...GOOD, name: '  ' }, { ...GOOD, email: 'kein-email' }, { ...GOOD, message: 'kurz' }, { ...GOOD, consent: 'true' }, { ...GOOD, consent: false }]) {
    const response = await handleContact(post(bad), makeEnv(), mailer)
    assert.equal(response.status, 422)
  }
  assert.equal(mailer.sent.length, 0)
})

test('Kopfzeilen-Einschleusung (CR/LF in Name oder E-Mail) wird neutralisiert bzw. abgelehnt', async () => {
  assert.equal(cleanLine('Max\r\nBcc: evil@example.com', 100), 'Max Bcc: evil@example.com')
  assert.equal(validate({ ...GOOD, email: 'a@b.de\r\nBcc: evil@example.com' }).ok, false)
  const mail = buildMail(validate({ ...GOOD, name: 'Max\r\nBcc: evil@example.com' }).value, makeEnv())
  assert.ok(!/[\r\n]/.test(mail.subject))
  assert.ok(!/[\r\n]/.test(mail.reply.name))
})

test('zu lange Eingaben werden gekürzt, zu große Anfragen abgelehnt', async () => {
  const v = validate({ ...GOOD, name: 'N'.repeat(500), message: 'm'.repeat(9000) })
  assert.equal(v.value.name.length, 100)
  assert.equal(v.value.message.length, 4000)
  const response = await handleContact(post(null, { raw: JSON.stringify({ ...GOOD, message: 'x'.repeat(20000) }) }), makeEnv(), collector())
  assert.equal(response.status, 413)
})

test('ungültiges JSON und falsche Methode', async () => {
  assert.equal((await handleContact(post(null, { raw: '{kaputt' }), makeEnv(), collector())).status, 400)
  assert.equal((await handleContact(post(null, { method: 'GET' }), makeEnv(), collector())).status, 405)
})

test('fremde Herkunft (Origin) wird abgelehnt, Vorab-Anfrage (OPTIONS) erlaubt', async () => {
  assert.equal((await handleContact(post(GOOD, { origin: 'https://evil.example' }), makeEnv(), collector())).status, 403)
  const pre = await handleContact(post(null, { method: 'OPTIONS' }), makeEnv(), collector())
  assert.equal(pre.status, 204)
  assert.equal(pre.headers.get('Access-Control-Allow-Origin'), 'https://lambking.store')
})

test('Rate Limit: höchstens 3 pro IP und Stunde, andere IPs bleiben möglich', async () => {
  const mailer = collector()
  const env = makeEnv()
  for (let i = 0; i < 3; i += 1) assert.equal((await handleContact(post(GOOD), env, mailer)).status, 200)
  const blocked = await handleContact(post(GOOD), env, mailer)
  assert.equal(blocked.status, 429)
  assert.equal((await blocked.json()).error, 'rate_limit')
  assert.equal((await handleContact(post(GOOD, { ip: '198.51.100.9' }), env, mailer)).status, 200)
  assert.equal(mailer.sent.length, 4)
})

test('IP-Adresse wird nie im Klartext gespeichert und jeder Eintrag läuft automatisch ab', async () => {
  const env = makeEnv()
  await handleContact(post(GOOD, { ip: '203.0.113.7' }), env, collector())
  assert.ok(env.RATE.puts.length >= 1)
  for (const put of env.RATE.puts) {
    assert.ok(!put.key.includes('203.0.113.7') && !put.value.includes('203.0.113.7'))
    assert.ok(put.options.expirationTtl >= 60 && put.options.expirationTtl <= 90000)
  }
  const ipPut = env.RATE.puts.find((p) => p.key.startsWith('ip:'))
  assert.ok(ipPut.options.expirationTtl <= 3600)
  assert.equal(JSON.parse(ipPut.value).c, 1)
})

test('SMTP-Fehler ergibt 502 ohne Details, fehlende Konfiguration 503', async () => {
  const failing = { sendMail: async () => { throw new Error('geheim: Passwort falsch') } }
  const response = await handleContact(post(GOOD), makeEnv(), failing)
  assert.equal(response.status, 502)
  assert.ok(!(await response.text()).includes('geheim'))
  assert.equal((await handleContact(post(GOOD), makeEnv({ SMTP_PASS: '' }), collector())).status, 503)
})

test('Nachricht wird nur als Text gesendet (kein HTML)', async () => {
  const mailer = collector()
  await handleContact(post({ ...GOOD, message: '<script>alert(1)</script>' + ' lange Nachricht' }), makeEnv(), mailer)
  assert.equal(mailer.sent[0].html, undefined)
})
