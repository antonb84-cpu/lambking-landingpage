// Verhaltenstest der Zählung (src/data/analytics.ts): Der echte Code wird mit nachgebauter Browser-Umgebung
// ausgeführt. Geprüft wird, WAS an den Zähldienst geschickt wird – bei Erfolg, bei blockierter Anfrage und lokal.
// Läuft als Teil von „npm run test".

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0

function check(name, ok, detail = '') {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ` – ${detail}`}`)
  if (!ok) failed++
}

// Den echten Code bündeln; „@/data/books" (nur die Einstellung der Zähler-Adresse) wird durch eine Attrappe ersetzt.
const bundle = await build({
  stdin: { contents: "export * from './src/data/analytics.ts'", resolveDir: ROOT, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'neutral',
  plugins: [
    {
      name: 'books-attrappe',
      setup(b) {
        b.onResolve({ filter: /^@\/data\/books$/ }, () => ({ path: 'books', namespace: 'attrappe' }))
        b.onLoad({ filter: /.*/, namespace: 'attrappe' }, () => ({ contents: "export const SITE = { analyticsUrl: 'https://zaehler.test/' }", loader: 'js' }))
      },
    },
  ],
})
const source = bundle.outputFiles[0].text

let counter = 0
async function load() {
  counter += 1 // frisches Modul pro Szenario (der Seitenaufruf wird pro Sitzung nur einmal gezählt)
  return import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${counter}`).toString('base64')}`)
}

function environment({ host, fetchBehaviour, beaconAvailable = true }) {
  const calls = { fetch: [], beacon: [] }
  globalThis.window = { location: { hostname: host } }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: beaconAvailable ? { sendBeacon: (url, blob) => { calls.beacon.push({ url, blob }); return true } } : {},
  })
  globalThis.fetch = (url, options) => {
    calls.fetch.push({ url, body: JSON.parse(options.body), options })
    return fetchBehaviour === 'blocked' ? Promise.reject(new TypeError('blocked')) : Promise.resolve({ status: 204 })
  }
  return calls
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

// 1) Normale Seite: Seitenaufruf und Klicks gehen per Anfrage (keepalive) an den Zähldienst
{
  const calls = environment({ host: 'lambking.store', fetchBehaviour: 'ok' })
  const analytics = await load()
  analytics.trackPageView()
  analytics.trackPageView() // nur einmal pro Sitzung
  analytics.trackAmazonClick('david', 'de')
  analytics.trackAmazonClick('bibelgeschichten-zum-ausmalen-4', 'es')
  analytics.trackLinkClick('paypal')
  analytics.trackLinkClick('kofi')
  analytics.trackLinkClick('playstore')
  analytics.trackLinkClick('appstore')
  await settle()
  const bodies = calls.fetch.map((c) => JSON.stringify(c.body))
  check('Seitenaufruf wird genau einmal gesendet', bodies.filter((b) => b === '{"event":"pageview"}').length === 1, bodies.join(' '))
  check('Amazon-Klick: Buch und Sprache', bodies.includes('{"event":"amazon_click","target":"david-de"}') && bodies.includes('{"event":"amazon_click","target":"bibelgeschichten-zum-ausmalen-4-es"}'), bodies.join(' '))
  check('PayPal, Ko-fi, Google Play und App Store werden gesendet', ['paypal', 'kofi', 'playstore', 'appstore'].every((l) => bodies.includes(`{"event":"amazon_click","target":"link-${l}"}`)), bodies.join(' '))
  check('Ziel-Adresse ist /event des Zähldienstes (ohne doppelten Schrägstrich)', calls.fetch.every((c) => c.url === 'https://zaehler.test/event'), calls.fetch[0]?.url)
  check('Anfragen laufen mit keepalive und ohne Cookies/Referrer', calls.fetch.every((c) => c.options.keepalive === true && c.options.credentials === 'omit' && c.options.referrerPolicy === 'no-referrer'))
  check('sendBeacon wird nicht zusätzlich benutzt (keine Doppelzählung)', calls.beacon.length === 0, `${calls.beacon.length} Beacons`)
  check('Alle Ziele erfüllen das Muster des Zähldienstes', calls.fetch.map((c) => c.body.target).filter(Boolean).every((t) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(t)))
}

// 2) Anfrage wird blockiert (z. B. Werbeblocker): Reserve sendBeacon greift genau einmal pro Ereignis
{
  const calls = environment({ host: 'lambking.store', fetchBehaviour: 'blocked' })
  const analytics = await load()
  analytics.trackAmazonClick('david', 'de')
  await settle()
  check('Blockierte Anfrage: Reserve über sendBeacon, genau einmal', calls.beacon.length === 1 && calls.fetch.length === 1, `fetch ${calls.fetch.length}, beacon ${calls.beacon.length}`)
}

// 3) Lokale Vorschau zählt nicht
for (const host of ['localhost', '127.0.0.1', 'vorschau.localhost']) {
  const calls = environment({ host, fetchBehaviour: 'ok' })
  const analytics = await load()
  analytics.trackPageView()
  analytics.trackAmazonClick('david', 'de')
  analytics.trackLinkClick('kofi')
  await settle()
  check(`Lokal (${host}) wird nichts gesendet`, calls.fetch.length === 0 && calls.beacon.length === 0, `${calls.fetch.length}/${calls.beacon.length}`)
}

// 4) Ungültige Ziele werden verworfen, der Selbsttest meldet Erfolg und Blockade verständlich
{
  const calls = environment({ host: 'lambking.store', fetchBehaviour: 'ok' })
  const analytics = await load()
  analytics.trackAmazonClick('david:de')
  analytics.trackAmazonClick('Gross', 'de')
  await settle()
  check('Ungültige Ziele („david:de“, Großbuchstaben) werden nicht gesendet', calls.fetch.length === 0, calls.fetch.map((c) => JSON.stringify(c.body)).join(' '))
  const good = await analytics.counterSelfTest()
  check('Selbsttest: Erfolg bei Status 204', good.ok === true && good.status === 204)
}
{
  environment({ host: 'lambking.store', fetchBehaviour: 'blocked' })
  const analytics = await load()
  const bad = await analytics.counterSelfTest()
  check('Selbsttest: Blockade wird als solche erklärt', bad.ok === false && /blockiert/.test(bad.message))
}
{
  environment({ host: 'localhost', fetchBehaviour: 'ok' })
  const analytics = await load()
  const local = await analytics.counterSelfTest()
  check('Selbsttest: lokal wird erklärt, dass nicht gezählt wird', local.ok === false && local.local === true)
}

if (failed > 0) {
  console.log(`\n  ${failed} Zähler-Prüfung(en) fehlgeschlagen`)
  process.exit(1)
}
