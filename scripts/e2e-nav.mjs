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
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
  await new Promise((r) => setTimeout(r, 5000))

  const tests = [
    ['Bücher', '#buecher'],
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

  // Buchfenster: Mengenrabatt öffnet eine eigene, zweisprachige Information
  // mit der vereinbarten Staffel und direktem E-Mail-Kontakt.
  {
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#buecher` })
    await new Promise((r) => setTimeout(r, 1400))
    await evalJs(`document.querySelector('#buecher article button[aria-label^="Inhalt ansehen:"]')?.click()`)
    await waitForPageState(`document.querySelectorAll('[role="dialog"]').length === 1`)
    const galleryStart = await evalJs(`document.querySelector('[role="dialog"]')?.textContent.includes('Cover · 1/')`)
    await evalJs(`document.querySelector('[role="dialog"] button[aria-label="Nächstes Bild"]')?.click()`)
    const lifestyleShown = await waitForPageState(`document.querySelector('[role="dialog"] img[alt*="Buch in der Hand"]') !== null`)
    await evalJs(`document.querySelector('[role="dialog"] button[aria-label="Nächstes Bild"]')?.click()`)
    const openBookShown = await waitForPageState(`document.querySelector('[role="dialog"] img[src*="schoepfung-de-offen.png"]') !== null`)
    await evalJs(`document.querySelector('[role="dialog"] button[aria-label="Nächstes Bild"]')?.click()`)
    const sampleShown = await waitForPageState(`document.querySelector('[role="dialog"] img[alt*="Vorschauseite 1"]') !== null`)
    const galleryOk = galleryStart && lifestyleShown && openBookShown && sampleShown
    console.log(`${galleryOk ? '✓' : '✗'} Buchgalerie: Cover → Buchfoto → aufgeschlagenes Buch → echte Vorschauseite`)
    if (!galleryOk) fehler++
    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 900, deviceScaleFactor: 1, mobile: false })
    const buttonLayoutJson = await evalJs(`(() => {
      const dialog = document.querySelector('[role="dialog"]')
      const amazon = dialog?.querySelector('a[href*="amazon."]')?.getBoundingClientRect()
      const discount = [...dialog.querySelectorAll('button')].find(b => b.textContent.includes('Mengenrabatt ab 10 Stück'))?.getBoundingClientRect()
      return JSON.stringify({amazon:{x:amazon?.x,width:amazon?.width}, discount:{x:discount?.x,width:discount?.width}})
    })()`)
    await send('Emulation.clearDeviceMetricsOverride')
    const buttonLayout = JSON.parse(buttonLayoutJson || '{}')
    const aligned = Math.abs(buttonLayout.amazon?.x - buttonLayout.discount?.x) < 2 && Math.abs(buttonLayout.amazon?.width - buttonLayout.discount?.width) < 2
    console.log(`${aligned ? '✓' : '✗'} Mittlere Breite: Mengenrabatt direkt unter Amazon und gleich breit`)
    if (!aligned) fehler++
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Mengenrabatt ab 10 Stück'))?.click()`)
    const discountStateJson = await waitForPageState(`(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')]
      const dialog = dialogs.at(-1)
      if (dialogs.length !== 2 || !dialog) return ''
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
    console.log(`${ok ? '✓' : '✗'} Mengenrabatt: vier Rabattstufen und E-Mail-Kontakt im Buchfenster`)
    if (!ok) fehler++
    await evalJs(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.__copiedEmail = text } } })`)
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('E-Mail-Adresse kopieren'))?.click()`)
    const copied = await waitForPageState(`document.querySelector('[role="status"]')?.textContent.includes('E-Mail-Adresse kopiert') && window.__copiedEmail === 'hello@lambking.store'`)
    const copyOk = copied === true
    console.log(`${copyOk ? '✓' : '✗'} Mengenrabatt: E-Mail-Adresse wird kopiert und sichtbar bestätigt`)
    if (!copyOk) fehler++
    await evalJs(`[...document.querySelectorAll('[role="dialog"]')].at(-1)?.querySelector('[data-slot="dialog-close"]')?.click()`)
    await waitForPageState(`document.querySelectorAll('[role="dialog"]').length === 1`)
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1200))
  }

  {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    const before = await targetCount()
    const media = JSON.parse(await evalJs(`JSON.stringify({
      cover: document.querySelector('.book3d-leaf-front')?.getAttribute('src'),
      coverCropped: document.querySelector('.book3d-leaf-front')?.classList.contains('book3d-leaf-front--spread'),
      coverPosition: getComputedStyle(document.querySelector('.book3d-leaf-front')).objectPosition,
      backs: [...document.querySelectorAll('.book3d-leaf-back')].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 }))
    })`) || '{}')
    const realPages = media.cover?.includes('cover-band01-de-spread')
      && media.coverCropped
      && media.coverPosition.startsWith('100%')
      && media.backs?.length > 0
      && media.backs.every(page => page.loaded && page.src?.includes('seite-'))
    console.log(`${realPages ? '✓' : '✗'} Hero-Buch: vollständige Cover-Vorderseite und echte bedruckte Rückseiten`)
    if (!realPages) fehler++
    const result = await evalJs(`(() => {
      const book = document.querySelector('.book3d-scene')
      book.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerType:'touch'}))
      book.click()
      const contextMenuBlocked = !book.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}))
      return {contextMenuBlocked, touchOpen:book.dataset.touchOpen}
    })()`)
    const stateJson = await waitForPageState(`(() => {
      const state = {
        dialog: !!document.querySelector('[role="dialog"]'),
        touchOpen: document.querySelector('.book3d-scene')?.dataset.touchOpen,
        allLeavesOpen: [...document.querySelectorAll('.book3d-leaf')].every(leaf => leaf.style.transform.includes('rotateY(-172deg)'))
      }
      return state.touchOpen === 'true' && state.allLeavesOpen ? JSON.stringify(state) : ''
    })()`)
    const after = await targetCount()
    const state = JSON.parse(stateJson || '{}')
    const openBounds = JSON.parse(await evalJs(`(() => {
      const pages = [...document.querySelectorAll('.book3d-leaf, .book3d-page-base')]
      return JSON.stringify({ left: Math.min(...pages.map(page => page.getBoundingClientRect().left)), right: Math.max(...pages.map(page => page.getBoundingClientRect().right)), width: innerWidth })
    })()`) || '{}')
    const opened = after === before && result.contextMenuBlocked && state.touchOpen === 'true' && state.allLeavesOpen && !state.dialog
      && openBounds.left >= -2 && openBounds.right <= openBounds.width + 2
    await evalJs(`(() => {
      const book = document.querySelector('.book3d-scene')
      book.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerType:'touch'}))
      book.click()
    })()`)
    const closedJson = await waitForPageState(`(() => {
      const state = {
        touchOpen: document.querySelector('.book3d-scene')?.dataset.touchOpen,
        allLeavesClosed: [...document.querySelectorAll('.book3d-leaf')].every(leaf => leaf.style.transform.includes('rotateY(0deg)'))
      }
      return state.touchOpen === 'false' && state.allLeavesClosed ? JSON.stringify(state) : ''
    })()`)
    const closed = JSON.parse(closedJson || '{}')
    const ok = opened && closed.touchOpen === 'false' && closed.allLeavesClosed
    console.log(`${ok ? '✓' : '✗'} Smartphone-Tipp öffnet und schließt das Hero-Buch vollständig, ohne Bildmenü oder Dialog (Tabs ${before}→${after})`)
    if (!ok) fehler++
    await send('Emulation.clearDeviceMetricsOverride')
    // Für die folgenden Prüfungen auf einen garantiert sauberen Seitenzustand
    // zurückkehren. Das ist auch auf langsameren GitHub-Runnern stabiler als
    // auf das Ende einer Dialog-Schließanimation zu warten.
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` })
    await new Promise((r) => setTimeout(r, 1800))
  }

  {
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN')?.click()`)
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
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'DE')?.click()`)
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
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN')?.click()`)
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

  ws.close()
} finally {
  chrome.kill()
  server.close()
}

console.log(fehler === 0 ? 'ALLE E2E-TESTS BESTANDEN ✓' : `${fehler} E2E-FEHLER`)
process.exit(fehler ? 1 : 0)
