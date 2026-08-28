// LambKing Tests – strukturelle Prüfungen ohne Browser.
// Läuft mit: npm run test   (lokal, frischer Klon, GitHub Actions)
// Ziel: Der „leerer Tab"-Fehler und ähnliche Fehler können nicht
// unbemerkt zurückkommen.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

let passed = 0
let failed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    failures.push(`${name}: ${e.message}`)
    console.log(`  ✗ ${name} – ${e.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

const srcFiles = [...walk(SRC)].filter((f) => ['.ts', '.tsx'].includes(extname(f)))
const srcText = srcFiles.map((f) => readFileSync(f, 'utf-8')).join('\n')
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf-8')

// ── 1. Link-Sicherheit (Punkt 83–86) ──────────────────────────
test('Keine leeren href="" im Code', () => {
  assert(!/href=["']\s*["']/.test(srcText + indexHtml), 'leeres href gefunden')
})

test('Kein window.open im Code', () => {
  assert(!/window\.open\s*\(/.test(srcText), 'window.open gefunden')
})

test('Interne Anker (#…) öffnen nie in neuem Tab', () => {
  for (const line of srcText.split('\n')) {
    if (line.includes('href="#') || line.includes("href: '#")) {
      assert(!line.includes('target='), `interner Link mit target: ${line.trim()}`)
    }
  }
})

test('Keine javascript:-URLs', () => {
  assert(!/href=["']javascript:/i.test(srcText + indexHtml), 'javascript:-URL gefunden')
})

test('Alle internen Ankerziele existieren als Sektion', () => {
  const anchors = new Set([...srcText.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]))
  for (const a of anchors) {
    assert(srcText.includes(`id="${a}"`), `Ankerziel #${a} hat keine Sektion`)
  }
})

test('Hero-Buch ist ein <button>, kein Link', () => {
  const hero = readFileSync(join(SRC, 'sections/Hero.tsx'), 'utf-8')
  assert(hero.includes('openBookById'), 'Buch-Klick öffnet nicht den Dialog')
  assert(!/<a[^>]*book3d/.test(hero), '3D-Buch ist noch ein Link')
})

// ── 2. Buchdaten ──────────────────────────────────────────────
const booksJson = JSON.parse(readFileSync(join(SRC, 'data/books.json'), 'utf-8'))

test('Buchdaten: Pflichtfelder und gültige Links', () => {
  assert(Array.isArray(booksJson.books), 'books fehlt')
  for (const b of booksJson.books) {
    assert(b.id && b.title, `Buch ohne id/titel: ${JSON.stringify(b).slice(0, 60)}`)
    assert(['de', 'en'].includes(b.lang), `${b.id}: ungültige Sprache`)
    assert(['geschichten', 'malbuecher', 'komics'].includes(b.category), `${b.id}: ungültige Kategorie`)
    assert(!b.amazon || b.amazon.startsWith('https://'), `${b.id}: Amazon-Link ungültig`)
    assert(!('tiktok' in b), `${b.id}: TikTok-Feld vorhanden`)
    assert(!('price' in b), `${b.id}: statischer Preis vorhanden`)
    assert(!('rating' in b), `${b.id}: statische Bewertung vorhanden`)
  }
})

test('Buchdaten: Cover und Beispielseiten existieren als Datei', () => {
  for (const b of booksJson.books) {
    const cover = join(ROOT, 'public', b.cover)
    assert(existsSync(cover), `${b.id}: Cover fehlt (${b.cover})`)
    for (const s of b.samples || []) {
      assert(existsSync(join(ROOT, 'public', s)), `${b.id}: Beispielseite fehlt (${s})`)
    }
  }
})

test('Buchtypen sind lokalisiert (kein gemischter Sprach-String in Daten)', () => {
  const texts = readFileSync(join(SRC, 'data/texts.ts'), 'utf-8')
  for (const cat of ['geschichten', 'malbuecher', 'komics']) {
    assert(texts.includes(`types: {`), 'types-Mapping fehlt in texts.ts')
    break
  }
  assert(texts.includes('Coloring Book') && texts.includes('Malbuch'), 'DE/EN-Typen fehlen')
})

// ── 3. Rechtliches ────────────────────────────────────────────
test('Impressum ohne Platzhalter', () => {
  const imp = booksJson.site.impressum || ''
  for (const ph of ['[', 'REPLACE_ME', 'Straße und Hausnummer', 'PLZ und Ort', 'deine@email.de']) {
    assert(!imp.includes(ph), `Impressum enthält Platzhalter: ${ph}`)
  }
  assert(imp.includes('Anton Bernt') && imp.includes('@'), 'Impressum unvollständig')
})

test('Datenschutzerklärung vorhanden und aktuell (GitHub Pages, localStorage)', () => {
  const ds = booksJson.site.datenschutz || ''
  assert(ds.includes('GitHub'), 'GitHub-Hosting fehlt')
  assert(ds.includes('lambking-lang'), 'Sprach-speicherung fehlt')
  assert(ds.includes('Ko-fi'), 'Ko-fi fehlt')
})

// ── 4. Netzwerk-Reinheit ──────────────────────────────────────
test('Kein TikTok mehr im Projekt', () => {
  const all = srcText + indexHtml + JSON.stringify(booksJson)
  assert(!/tiktok/i.test(all), 'TikTok-Referenz gefunden')
})

test('Keine Google-Fonts-Verbindung', () => {
  const all = srcText + indexHtml
  assert(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(all), 'Google-Fonts-Referenz gefunden')
})

test('Ko-fi nur als reiner Link (kein Widget/SDK/iframe)', () => {
  assert(!/storage\.ko-fi\.com|kofi.*widget|<iframe[^>]*ko-fi/i.test(srcText), 'Ko-fi-Widget gefunden')
  assert(booksJson.site.kofiUrl?.startsWith('https://ko-fi.com/'), 'Ko-fi-Link fehlt/ungültig')
})

// ── 5. Struktur & Portabilität ────────────────────────────────
test('Keine hartcodierten absoluten PC-Pfade im Quellcode', () => {
  const adminPy = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(!/C:\\\\Users|AppData|kimi-desktop/i.test(adminPy), 'absoluter PC-Pfad im Admin')
  assert(!/_tmp[\\/]repo/.test(adminPy), 'alte _tmp/repo-Abhängigkeit gefunden')
})

test('Kein React Router mehr (Anker-Navigation)', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  assert(!pkg.dependencies?.['react-router'], 'react-router noch in package.json')
  assert(!srcText.includes('react-router'), 'react-router noch im Quellcode')
})

test('Admin-Dateien und requirements.txt vorhanden', () => {
  assert(existsSync(join(ROOT, 'admin/admin_server.py')), 'admin_server.py fehlt')
  assert(existsSync(join(ROOT, 'admin/index.html')), 'Admin-Oberfläche fehlt')
  assert(existsSync(join(ROOT, 'admin/requirements.txt')), 'requirements.txt fehlt')
  assert(existsSync(join(ROOT, 'admin/startcheck.py')), 'startcheck.py fehlt')
  assert(existsSync(join(ROOT, 'ADMIN-STARTEN.bat')), 'ADMIN-STARTEN.bat fehlt')
})

test('Ungültige Buch-ID verursacht keinen Absturz (Guard vorhanden)', () => {
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  assert(/if \(found\)/.test(books), 'Deep-Link-Guard fehlt')
})

// ── Ergebnis ──────────────────────────────────────────────────
console.log()
console.log(`  ${passed} bestanden, ${failed} fehlgeschlagen`)
if (failed > 0) {
  console.log('\n  FEHLER:')
  failures.forEach((f) => console.log(`   • ${f}`))
  process.exit(1)
}
console.log('  Alle Tests bestanden. ✓')
