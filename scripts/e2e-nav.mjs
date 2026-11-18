// E2E-Test: Interne Navigation, 3D-Buch, Sprachwechsel – ohne neue Tabs.
// Läuft lokal (npm run test:e2e) und in GitHub Actions nach dem Build.
// Baut einen Mini-Static-Server für dist/ und steuert Chrome über CDP.

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml',
}

// Chrome finden (Windows & Linux/GitHub Actions)
import { spawnSync } from 'node:child_process'

function which(cmd) {
  const r = spawnSync('which', [cmd], { encoding: 'utf-8' })
  return r.status === 0 ? r.stdout.trim().split('\n')[0] : null
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  which('google-chrome'),
  which('google-chrome-stable'),
  which('chromium'),
  which('chromium-browser'),
].filter(Boolean)
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!CHROME) {
  console.error('Chrome/Chromium wurde nicht gefunden – E2E-Test kann nicht laufen.')
  process.exit(1)
}

const server = createServer((req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  if (rel.endsWith('/')) rel += 'index.html'
  const f = join(DIST, rel)
  if (!f.startsWith(DIST) || !existsSync(f)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => server.listen(0, r))
const HTTP_PORT = server.address().port

const CDP_PORT = 9555
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,1000', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })
chrome.stderr.on('data', (d) => {
  const t = d.toString()
  if (/error|fatal/i.test(t)) console.error('[chrome]', t.trim().slice(0, 200))
})

let fehler = 0
try {
  // Langsamere GitHub-Runner brauchen nach dem Chrome-Start gelegentlich
  // deutlich länger als lokale Rechner. Bis zu 30 Sekunden warten.
  let list = null
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json()
      break
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  if (!list) throw new Error('Chrome-CDP-Schnittstelle nicht erreichbar')
  const page = list.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)

  let id = 0
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id
      const onMsg = (ev) => {
        const d = JSON.parse(ev.data)
        if (d.id === mid) {
          ws.removeEventListener('message', onMsg)
          resolve(d.result)
        }
      }
      ws.addEventListener('message', onMsg)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })

  const evalJs = async (expr) =>
    (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value

  const waitForPageState = async (expr, timeoutMs = 12000) => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const value = await evalJs(expr)
      if (value) return value
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    return null
  }

  const targetCount = async () =>
    (await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json()).filter((t) => t.type === 'page').length

  await new Promise((r) => ws.addEventListener('open', r))
  // Lokale Vorschau darf keine Zähler-Ereignisse senden (sonst verfälschen eigene Tests die Statistik)
  const countedRequests = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.method === 'Network.requestWillBeSent' && String(msg.params.request.url).includes('/event')) countedRequests.push(msg.params.request.url)
  })
  await send('Network.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
  await new Promise((r) => setTimeout(r, 5000))

  // „Alle Bücher“ filtert den Bücherbereich auf der Startseite und scrollt dorthin (kein Anker in der Adresse)
  {
    const before = await targetCount()
    const res = await evalJs(`(() => {
      const a = [...document.querySelectorAll('header nav a')].find(x => x.textContent.trim() === 'Alle Bücher')
      if (!a) return 'NICHT GEFUNDEN'
      a.click(); return 'ok'
    })()`)
    await new Promise((r) => setTimeout(r, 1200))
    const after = await targetCount()
    const scrollY = await evalJs(`Math.round(window.scrollY)`)
    const cards = await evalJs(`document.querySelectorAll('#buecher article').length`)
    const ok = res === 'ok' && after === before && scrollY > 50 && cards > 10
    console.log(`${ok ? '✓' : '✗'} Alle Bücher → Bücherbereich (Tabs ${before}→${after}, ScrollY ${scrollY}, Karten ${cards})`)
    if (!ok) fehler++
  }

  const tests = [
    ['App', '#app'],
    ['Über das Projekt', '#ueber'],
    ['FAQ', '#faq'],
  ]
  for (const [label, hash] of tests) {
    const before = await targetCount()
    const res = await evalJs(`(() => {
      const a = [...document.querySelectorAll('header nav a')].find(x => x.textContent.trim() === ${JSON.stringify(label)})
      if (!a) return 'NICHT GEFUNDEN'
      a.click(); return 'ok'
    })()`)
    await new Promise((r) => setTimeout(r, 1200))
    const after = await targetCount()
    const s = JSON.parse(await evalJs(`JSON.stringify({hash: location.hash, scrollY: Math.round(window.scrollY)})`) || '{}')
    const ok = res === 'ok' && after === before && s.hash === hash && s.scrollY > 50
    const details = ok ? '' : `, Ergebnis ${res}, Hash ${s.hash || 'leer'}, ScrollY ${s.scrollY ?? 'unbekannt'}`
    console.log(`${ok ? '✓' : '✗'} ${label} → ${hash} (Tabs ${before}→${after}${details})`)
    if (!ok) fehler++
  }

  // Kontaktformular: Link in der Fußzeile, Pflichtfelder, unsichtbarer Honeypot, kein Versand bei leerem Formular
  {
    const formRequests = []
    const onMessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.method === 'Network.requestWillBeSent' && String(msg.params.request.url).includes('/contact')) formRequests.push(msg.params.request.url)
    }
    ws.addEventListener('message', onMessage)
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 2500))
    const before = await targetCount()
    await evalJs(`[...document.querySelectorAll('footer a')].find(a => a.textContent.trim() === 'Schreib uns')?.click()`)
    await new Promise((r) => setTimeout(r, 1500))
    const nav = JSON.parse(await evalJs(`JSON.stringify({hash: location.hash, top: Math.round(document.getElementById('kontakt')?.getBoundingClientRect().top ?? -1)})`) || '{}')
    const after = await targetCount()
    const fields = await evalJs(`['name','email','message','consent','website'].every(n => document.querySelector('#kontakt [name="' + n + '"]'))`)
    const honeypot = JSON.parse(await evalJs(`(() => { const i = document.querySelector('#kontakt input[name="website"]'); return JSON.stringify({right: i.getBoundingClientRect().right, tab: i.tabIndex}) })()`) || '{}')
    await evalJs(`document.querySelector('#kontakt button[type="submit"]')?.click()`)
    await new Promise((r) => setTimeout(r, 600))
    const errorCount = await evalJs(`document.querySelectorAll('#kontakt [id^="contact-error-"]').length`)
    const privacyLink = await evalJs(`document.querySelector('#kontakt a[href="datenschutz/"]')?.getAttribute('target')`)
    ws.removeEventListener('message', onMessage)
    const ok = nav.hash === '#kontakt' && nav.top >= 0 && nav.top < 400 && after === before && fields && honeypot.right < 0 && honeypot.tab === -1
      && errorCount === 4 && formRequests.length === 0 && privacyLink === '_blank'
    console.log(`${ok ? '✓' : '✗'} Kontaktformular: Fußzeilen-Link, Pflichtfelder, Honeypot unsichtbar, leer = kein Versand${ok ? '' : ` (Hash ${nav.hash}, oben ${nav.top}, Felder ${fields}, Honeypot ${JSON.stringify(honeypot)}, Fehler ${errorCount}, Anfragen ${formRequests.length}, Link ${privacyLink})`}`)
    if (!ok) fehler++
  }

  // Buchseite: Bildergalerie (Cover → Buchfoto → aufgeschlagenes Buch) und Mengenrabatt mit eigener,
  // zweisprachiger Information (vereinbarte Staffel, direkter E-Mail-Kontakt).
  {
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/buch/die-schoepfung-gott-macht-die-welt/` })
    const galleryStart = await waitForPageState(`document.body.textContent.includes('Cover · 1/') && !!document.querySelector('button[aria-label="Nächstes Bild"]')`, 12000)
    await evalJs(`document.querySelector('button[aria-label="Nächstes Bild"]')?.click()`)
    const lifestyleShown = await waitForPageState(`document.querySelector('main img[src*="schoepfung-de-hochformat.png"]') !== null`)
    await evalJs(`document.querySelector('button[aria-label="Nächstes Bild"]')?.click()`)
    const openBookShown = await waitForPageState(`document.querySelector('main img[src*="schoepfung-de-offen-rechts.png"]') !== null`)
    const galleryOk = galleryStart && lifestyleShown && openBookShown
    console.log(`${galleryOk ? '✓' : '✗'} Buchseite: Galerie Cover → Buchfoto → aufgeschlagenes Buch`)
    if (!galleryOk) fehler++
    // Klick auf das Buchbild führt zum Durchblättern; „Reinblättern“ steht nicht im Bestellkasten
    await evalJs(`scrollTo(0, 0)`)
    await evalJs(`document.querySelector('button[aria-label="Reinblättern"][title]')?.click()`)
    const flipTop = await waitForPageState(`(() => { const t = document.getElementById('blick-ins-buch')?.getBoundingClientRect().top; return t !== undefined && t < 400 && t > -200 ? 'ja' : '' })()`, 6000)
    const flipInBuyBox = await evalJs(`[...document.querySelector('main h1').closest('div').querySelectorAll('button')].some(b => /Reinblättern/.test(b.textContent))`)
    const flipOk = flipTop === 'ja' && flipInBuyBox === false
    console.log(`${flipOk ? '✓' : '✗'} Buchseite: Klick auf das Buchbild führt zum Durchblättern, Reinblättern-Knopf steht außerhalb des Bestellkastens${flipOk ? '' : ` (Ziel ${flipTop || 'nicht erreicht'}, im Kasten ${flipInBuyBox})`}`)
    if (!flipOk) fehler++
    await evalJs(`scrollTo(0, 0)`)
    await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false })
    const buttonLayoutJson = await evalJs(`(() => {
      const box = document.querySelector('main h1').closest('div')
      const amazon = box.querySelector('a[href*="amazon."] img[src*="buttons/amazon"]')?.closest('a')?.getBoundingClientRect()
      const discount = [...box.querySelectorAll('button')].find(b => b.textContent.includes('Mengenrabatt ab 10 Stück'))?.getBoundingClientRect()
      return JSON.stringify({amazon:{x:amazon?.x,width:amazon?.width}, discount:{x:discount?.x,width:discount?.width}})
    })()`)
    await send('Emulation.clearDeviceMetricsOverride')
    const buttonLayout = JSON.parse(buttonLayoutJson || '{}')
    const aligned = Math.abs(buttonLayout.amazon?.x - buttonLayout.discount?.x) < 2 && buttonLayout.discount?.width > 100
    console.log(`${aligned ? '✓' : '✗'} Buchseite: Mengenrabatt steht direkt unter dem Amazon-Knopf`)
    if (!aligned) fehler++
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Mengenrabatt ab 10 Stück'))?.click()`)
    const discountStateJson = await waitForPageState(`(() => {
      const dialog = document.querySelector('[role="dialog"]')
      if (!dialog) return ''
      return JSON.stringify({
        text: dialog.textContent,
        email: dialog.querySelector('a[href^="mailto:"]')?.getAttribute('href') || '',
        rows: dialog.querySelectorAll('tbody tr').length,
      })
    })()`)
    const discountState = JSON.parse(discountStateJson || '{}')
    const ok = discountState.rows === 4
      && ['ab 10 Stück', '15 %', 'ab 25 Stück', '25 %', 'ab 50 Stück', '35 %', 'ab 100 Stück', '40 %']
        .every((part) => discountState.text?.includes(part))
      && discountState.email.startsWith('mailto:hello@lambking.store?subject=')
    console.log(`${ok ? '✓' : '✗'} Mengenrabatt: vier Rabattstufen und E-Mail-Kontakt`)
    if (!ok) fehler++
    await evalJs(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.__copiedEmail = text } } })`)
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('E-Mail-Adresse kopieren'))?.click()`)
    const copied = await waitForPageState(`document.querySelector('[role="status"]')?.textContent.includes('E-Mail-Adresse kopiert') && window.__copiedEmail === 'hello@lambking.store'`)
    const copyOk = copied === true
    console.log(`${copyOk ? '✓' : '✗'} Mengenrabatt: E-Mail-Adresse wird kopiert und sichtbar bestätigt`)
    if (!copyOk) fehler++
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1200))
  }

  // Blick ins Buch: Das Softcover startet nicht von selbst, alle Seiten sind abrufbar
  // und die Sprungtasten funktionieren – ohne neuen Tab oder Dialog. (Nur wenn der Bereich eingeblendet ist.)
  if (await evalJs(`!!document.querySelector('#ausprobieren')`)) {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    const before = await targetCount()
    const state = JSON.parse(await evalJs(`(() => {
      const group = document.querySelector('#ausprobieren [role="group"]')
      const label = (re) => [...(group?.querySelectorAll('button') ?? [])].find(b => re.test(b.getAttribute('aria-label') || ''))
      const play = label(/Automatisch blättern|Pause/)
      return JSON.stringify({
        found: !!group,
        paused: !play || play.getAttribute('aria-pressed') === 'false', // am Handy gibt es keinen Selbstablauf
        lastEnabled: label(/Rückseite/)?.disabled === false,
        firstDisabled: label(/Titelseite/)?.disabled === true,
        images: group ? group.querySelectorAll('img').length : 0,
        overflow: document.documentElement.scrollWidth > innerWidth
      })
    })()`) || '{}')
    await evalJs(`[...document.querySelectorAll('#ausprobieren [role="group"] button')].find(b => /Rückseite/.test(b.getAttribute('aria-label') || ''))?.click()`)
    const atEnd = await waitForPageState(`[...document.querySelectorAll('#ausprobieren [role="group"] button')].find(b => /Rückseite/.test(b.getAttribute('aria-label') || ''))?.disabled === true`, 15000)
    const after = await targetCount()
    const ok = state.found && state.paused && state.lastEnabled && state.firstDisabled && state.images > 0 && !state.overflow
      && atEnd === true && after === before && !(await evalJs(`!!document.querySelector('[role="dialog"]')`))
    console.log(`${ok ? '✓' : '✗'} Blick ins Buch: startet nicht automatisch, Sprung zur Rückseite funktioniert, kein Überlauf am Smartphone (Tabs ${before}→${after})`)
    if (!ok) fehler++
    // Flaggen: Ein Klick auf eine Flagge zeigt das Buch in dieser Sprache (eigene Seiten und Titelseite)
    const flags = JSON.parse(await evalJs(`JSON.stringify([...document.querySelectorAll('#ausprobieren [role="group"] [role="group"] button')].map(b => b.getAttribute('aria-label')))`) || '[]')
    if (flags.length > 1) {
      const target = flags[1]
      const beforeSrc = await evalJs(`document.querySelector('#ausprobieren [role="group"] img')?.getAttribute('src') || ''`)
      await evalJs(`[...document.querySelectorAll('#ausprobieren [role="group"] [role="group"] button')].find(b => b.getAttribute('aria-label') === ${JSON.stringify(target)})?.click()`)
      const switched = await waitForPageState(`(() => {
        const group = document.querySelector('#ausprobieren [role="group"]')
        const pressed = [...group.querySelectorAll('[role="group"] button')].find(b => b.getAttribute('aria-pressed') === 'true')?.getAttribute('aria-label')
        const shown = group.querySelector('img')?.getAttribute('src') || ''
        return pressed === ${JSON.stringify(target)} && shown !== '' && shown !== ${JSON.stringify(beforeSrc)}
      })()`, 8000)
      console.log(`${switched ? '✓' : '✗'} Blick ins Buch: Flagge „${target}" zeigt das Buch in dieser Sprache`)
      if (!switched) fehler++
    }
    await send('Emulation.clearDeviceMetricsOverride')
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1800))
  }

  // Großes Blätterbuch: Auf der Buchseite öffnet „Groß ansehen“ ein Fenster mit Teil-Vorschau, das Ende verweist auf Amazon
  {
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/buch/die-schoepfung-gott-macht-die-welt/` })
    await waitForPageState(`!!document.querySelector('#blick-ins-buch')`, 8000)
    const before = await targetCount()
    await evalJs(`[...document.querySelectorAll('#blick-ins-buch button')].find(b => /Groß ansehen/.test(b.textContent))?.click()`)
    const opened = await waitForPageState(`/Leseprobe: \\d+ von \\d+ Seiten/.test(document.querySelector('[role="dialog"]')?.textContent || '')`, 8000)
    await evalJs(`[...document.querySelectorAll('[role="dialog"] button')].find(b => /Rückseite/.test(b.getAttribute('aria-label') || ''))?.click()`)
    await new Promise((r) => setTimeout(r, 1800))
    await evalJs(`[...document.querySelectorAll('[role="dialog"] button')].filter(b => /Zurückblättern/.test(b.getAttribute('aria-label') || '')).at(-1)?.click()`)
    const endShown = await waitForPageState(`/Das ganze Buch gibt es bei Amazon/.test(document.querySelector('[role="dialog"]')?.textContent || '') && !!document.querySelector('[role="dialog"] a[href*="amazon"]')`, 8000)
    const after = await targetCount()
    if (process.env.E2E_DEBUG) console.log({ opened, endShown })
    const ok = opened === true && endShown === true && after === before
    console.log(`${ok ? '✓' : '✗'} Großes Blätterbuch: Fenster mit Teil-Vorschau, Endseite mit Amazon-Weg (Tabs ${before}→${after})`)
    if (!ok) fehler++
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1500))
  }

  // Buchtitel ist ein echter Link auf die Buchseite (für Suchmaschinen) und führt dorthin, ohne neuen Tab
  {
    const before = await targetCount()
    const href = await evalJs(`document.querySelector('#buecher h3 a')?.getAttribute('href') || ''`)
    await evalJs(`document.querySelector('#buecher h3 a')?.click()`)
    const opened = await waitForPageState(`location.pathname.indexOf('/buch/') !== -1 && !!document.querySelector('main h1')`, 8000)
    const backLink = await waitForPageState(`[...document.querySelectorAll('a')].some(a => /Zurück zu allen Büchern/.test(a.textContent))`, 12000)
    const after = await targetCount()
    const ok = /^buch\/[a-z0-9-]+\/$/.test(href) && opened === true && backLink === true && after === before
    console.log(`${ok ? '✓' : '✗'} Buchtitel: echter Link (${href}), öffnet die Buchseite mit „Zurück zu allen Büchern“ ohne neuen Tab${ok ? '' : ` (geöffnet ${opened}, Rückweg ${backLink}, Tabs ${before}→${after})`}`)
    if (!ok) fehler++
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1500))
  }

  {
    await evalJs(`document.querySelector('button[aria-label="English"]')?.click()`)
    await new Promise((r) => setTimeout(r, 1500))
    const s = JSON.parse(await evalJs(`JSON.stringify({
      lang: document.documentElement.lang,
      cards: document.querySelectorAll('#buecher article').length
    })`) || '{}')
    const ok = s.lang === 'en'
    console.log(`${ok ? '✓' : '✗'} Sprachwechsel → <html lang="${s.lang}">, englische Bücher: ${s.cards}`)
    if (!ok) fehler++
  }

  // Rechts-Fenster: Impressum & Datenschutz öffnen ein Fenster (kein neuer Tab)
  await evalJs(`document.querySelector('button[aria-label="Deutsch"]')?.click()`)
  await new Promise((r) => setTimeout(r, 1000))
  for (const [label, marker] of [['Impressum', 'Anton Bernt'], ['Datenschutz', 'GitHub']]) {
    const before = await targetCount()
    await evalJs(`[...document.querySelectorAll('footer button')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`)
    await new Promise((r) => setTimeout(r, 900))
    const after = await targetCount()
    const s = JSON.parse(await evalJs(`JSON.stringify({
      dialog: !!document.querySelector('[role="dialog"]'),
      text: (document.querySelector('[role="dialog"]')?.textContent || ''),
    })`) || '{}')
    const ok = s.dialog && s.text.includes(marker) && after === before
    console.log(`${ok ? '✓' : '✗'} „${label}" öffnet Fenster mit Inhalt (Tabs ${before}→${after})`)
    if (!ok) fehler++
    await evalJs(`document.querySelector('[role="dialog"] button[class*="absolute"]')?.click()`)
    await new Promise((r) => setTimeout(r, 400))
  }

  // Eigenständige Creator-&-Partner-Route: Inhalt, SEO, Sprachwechsel und Formularzustand
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/creator-partner/` })
  await new Promise((r) => setTimeout(r, 1600))
  {
    const s = JSON.parse(await evalJs(`JSON.stringify({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent.trim(),
      form: !!document.querySelector('form'),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      title: document.title
    })`) || '{}')
    const ok = s.lang === 'de'
      && s.h1 === 'Werde Creator- oder Influencer-Partner von LambKing Stories'
      && s.form
      && s.canonical === 'https://lambking.store/creator-partner/'
      && s.title.includes('Creator- oder Influencer-Partner')
    console.log(`${ok ? '✓' : '✗'} Creator-Partner-Route: deutscher Inhalt, Formular und Canonical`)
    if (!ok) fehler++
  }

  {
    await evalJs(`document.querySelector('button[aria-label="English"]')?.click()`)
    await new Promise((r) => setTimeout(r, 900))
    const s = JSON.parse(await evalJs(`JSON.stringify({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent.trim(),
      ariaLabels: [...document.querySelectorAll('[aria-label]')].map(el => el.getAttribute('aria-label'))
    })`) || '{}')
    const forbidden = ['Hauptnavigation', 'Mobile Navigation', 'Fußzeilen-Navigation', 'Menü öffnen', 'Menü schließen']
    const ok = s.lang === 'en'
      && s.h1 === 'Become a LambKing Stories Creator or Influencer Partner'
      && !s.ariaLabels.some((label) => forbidden.includes(label))
    console.log(`${ok ? '✓' : '✗'} Creator-Partner-Route: englischer Inhalt ohne deutsche Navigations-ARIA-Texte`)
    if (!ok) fehler++
  }

  {
    await evalJs(`document.querySelector('form button[type="submit"]')?.click()`)
    await new Promise((r) => setTimeout(r, 500))
    const invalid = await evalJs(`!!document.querySelector('form :invalid')`)
    const ok = invalid === true
    console.log(`${ok ? '✓' : '✗'} Creator-Bewerbungsformular verhindert unvollständige Übermittlung`)
    if (!ok) fehler++
  }

  {
    const ok = countedRequests.length === 0
    console.log(`${ok ? '✓' : '✗'} Lokale Vorschau sendet keine Zähler-Ereignisse (${countedRequests.length} gesendet)`)
    if (!ok) fehler++
  }

  ws.close()
} finally {
  chrome.kill()
  server.close()
}

console.log(fehler === 0 ? 'ALLE E2E-TESTS BESTANDEN ✓' : `${fehler} E2E-FEHLER`)
process.exit(fehler ? 1 : 0)
