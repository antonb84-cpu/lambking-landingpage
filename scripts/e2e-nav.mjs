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
  // Warten, bis die CDP-Schnittstelle bereit ist (mit mehreren Versuchen)
  let list = null
  for (let i = 0; i < 20; i++) {
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

  {
    const before = await targetCount()
    const result = await evalJs(`(() => {
      const book = document.querySelector('.book3d-scene')
      book.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerType:'touch'}))
      book.click()
      const contextMenuBlocked = !book.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}))
      return {contextMenuBlocked, touchOpen:book.dataset.touchOpen}
    })()`)
    await new Promise((r) => setTimeout(r, 7000))
    const after = await targetCount()
    const state = JSON.parse(await evalJs(`JSON.stringify({
      dialog: !!document.querySelector('[role="dialog"]'),
      touchOpen: document.querySelector('.book3d-scene')?.dataset.touchOpen,
      allLeavesOpen: [...document.querySelectorAll('.book3d-leaf')].every(leaf => leaf.style.transform.includes('rotateY(-172deg)'))
    })`) || '{}')
    const ok = after === before && result.contextMenuBlocked && state.touchOpen === 'true' && state.allLeavesOpen && !state.dialog
    console.log(`${ok ? '✓' : '✗'} Smartphone-Tipp blättert Hero-Buch vollständig auf, ohne Bildmenü oder Dialog (Tabs ${before}→${after})`)
    if (!ok) fehler++
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

  ws.close()
} finally {
  chrome.kill()
  server.close()
}

console.log(fehler === 0 ? 'ALLE E2E-TESTS BESTANDEN ✓' : `${fehler} E2E-FEHLER`)
process.exit(fehler ? 1 : 0)
