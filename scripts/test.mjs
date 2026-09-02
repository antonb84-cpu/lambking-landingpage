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

test('Hero-Buch blättert am Smartphone ohne Bildmenü und ohne Weiterleitung', () => {
  const hero = readFileSync(join(SRC, 'sections/Hero.tsx'), 'utf-8')
  assert(!/<a[^>]*book3d/.test(hero), '3D-Buch ist noch ein Link')
  assert(!hero.includes('openBookById'), 'Hero-Buch öffnet noch die Buchansicht')
  assert(hero.includes('event.pointerType') && hero.includes("lastPointerType.current !== 'mouse'"), 'Touch-Aktivierung fehlt')
  assert(hero.includes('const nextOpen = !open') && hero.includes('kickRef.current(nextOpen)'), 'Erneutes Antippen schließt das Hero-Buch nicht')
  assert(hero.includes('onContextMenu') && hero.includes('draggable={false}'), 'Schutz vor dem mobilen Bildmenü fehlt')
  assert(hero.includes('data-touch-open'), 'Prüfbarer Touch-Öffnungszustand fehlt')
})

// ── 2. Buchdaten ──────────────────────────────────────────────
const booksJson = JSON.parse(readFileSync(join(SRC, 'data/books.json'), 'utf-8'))

test('Buchdaten: Pflichtfelder und gültige Links', () => {
  assert(Array.isArray(booksJson.books), 'books fehlt')
  const catIds = (booksJson.categories || []).map((c) => c.id)
  for (const b of booksJson.books) {
    assert(b.id && b.title, `Buch ohne id/titel: ${JSON.stringify(b).slice(0, 60)}`)
    assert(['de', 'en'].includes(b.lang), `${b.id}: ungültige Sprache`)
    assert(catIds.includes(b.category), `${b.id}: ungültige Kategorie`)
    assert(!b.amazon || b.amazon.startsWith('https://'), `${b.id}: Amazon-Link ungültig`)
    assert(!('tiktok' in b), `${b.id}: TikTok-Feld vorhanden`)
    assert(!('price' in b), `${b.id}: statischer Preis vorhanden`)
    assert(!('rating' in b), `${b.id}: statische Bewertung vorhanden`)
    if ('amazonRating' in b) {
      assert(typeof b.amazonRating === 'number' && b.amazonRating > 0 && b.amazonRating <= 5, `${b.id}: Amazon-Bewertung ungültig`)
    }
    if ('amazonRatingCount' in b) {
      assert(Number.isInteger(b.amazonRatingCount) && b.amazonRatingCount >= 0, `${b.id}: Amazon-Bewertungsanzahl ungültig`)
    }
  }
})

test('Buchdaten: Cover und Beispielseiten existieren als Datei', () => {
  for (const b of booksJson.books) {
    const cover = join(ROOT, 'public', b.cover)
    assert(existsSync(cover), `${b.id}: Cover fehlt (${b.cover})`)
    for (const s of b.samples || []) {
      assert(existsSync(join(ROOT, 'public', s)), `${b.id}: Beispielseite fehlt (${s})`)
    }
    assert((b.samples || []).length <= 10, `${b.id}: mehr als 10 Beispielseiten`)
  }
})

test('Vorschauseiten lassen sich ordnen und ein Hero-Buch auswählen', () => {
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const hero = readFileSync(join(SRC, 'sections/Hero.tsx'), 'utf-8')
  assert(admin.includes('sampleOrder') && admin.includes('moveSampleItem'), 'Sortierung der Vorschauseiten fehlt')
  assert(admin.includes('f_showInHero'), 'Hero-Vorschau-Schalter fehlt im Backend')
  assert(server.includes('MAX_SAMPLE_IMAGES = 10') && server.includes('sampleOrder'), 'Server begrenzt/sortiert Vorschauseiten nicht korrekt')
  assert(hero.includes('book.showInHero') && hero.includes('slice(0, 10)'), 'Startbereich verwendet die gewählte Vorschau nicht')
})

test('Buchtypen/Kategorien sind lokalisiert und konsistent', () => {
  const cats = booksJson.categories || []
  assert(cats.length >= 1, 'keine Kategorien definiert')
  const ids = cats.map((c) => c.id)
  assert(new Set(ids).size === ids.length, 'doppelte Kategorie-IDs')
  for (const c of cats) {
    assert(c.labelDe && c.labelEn && c.typeDe && c.typeEn, `Kategorie ${c.id} unvollständig`)
    assert(/^#[0-9a-fA-F]{6}$/.test(c.color), `Kategorie ${c.id}: ungültige Farbe`)
  }
  for (const b of booksJson.books) {
    assert(ids.includes(b.category), `${b.id}: unbekannte Kategorie ${b.category}`)
  }
})

// ── 3. Rechtliches ────────────────────────────────────────────
test('Impressum ohne Platzhalter', () => {
  const imp = booksJson.site.impressum || ''
  for (const ph of ['[', 'REPLACE_ME', 'Straße und Hausnummer', 'PLZ und Ort', 'deine@email.de']) {
    assert(!imp.includes(ph), `Impressum enthält Platzhalter: ${ph}`)
  }
  assert(imp.includes('Anton Bernt') && imp.includes('@'), 'Impressum unvollständig')
})

test('Datenschutzerklärung vorhanden und aktuell (GitHub Pages, Spracheinstellung)', () => {
  const ds = booksJson.site.datenschutz || ''
  assert(ds.includes('GitHub'), 'GitHub-Hosting fehlt')
  assert(ds.includes('lambking-lang'), 'Sprach-speicherung fehlt')
  assert(!ds.includes('lambking-rating-'), 'Alte lokale Sternebewertung steht noch in der Datenschutzerklärung')
  assert(ds.includes('Ko-fi'), 'Ko-fi fehlt')
})

test('Kontakt, Amazon-Bewertung und App-Store-Einstellung sind konfigurierbar', () => {
  assert(booksJson.site.contactEmail === 'hello@lambking.store', 'Kontakt-E-Mail ist nicht hello@lambking.store')
  assert(typeof booksJson.site.showRatings === 'boolean', 'Schalter für Sternebewertung fehlt')
  assert(typeof booksJson.site.iosStoreUrl === 'string', 'App-Store-Link-Einstellung fehlt')
  assert(existsSync(join(ROOT, 'public/images/buttons/app-store.svg')), 'App-Store-Badge fehlt')
})

test('Schließen-Knopf der Buchvorschau ist auf Smartphones groß genug', () => {
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const dialog = readFileSync(join(SRC, 'components/ui/dialog.tsx'), 'utf-8')
  assert(books.includes('closeButtonClassName') && books.includes('size-12'), 'Große mobile Schließen-Fläche fehlt')
  assert(books.includes('closeButtonIconClassName') && books.includes('size-7'), 'Großes mobiles Schließen-Symbol fehlt')
  assert(dialog.includes('closeButtonClassName') && dialog.includes('closeButtonIconClassName'), 'Dialog unterstützt keine gezielte Schließen-Größe')
})

test('Unterstützte Werke sind erweiterbar und können zweisprachige Flyer anzeigen', () => {
  const organizations = booksJson.site.supportedOrganizations
  assert(Array.isArray(organizations) && organizations.length >= 3, 'Die drei bestehenden Einrichtungen müssen erhalten bleiben')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const section = readFileSync(join(SRC, 'sections/SupportedWorks.tsx'), 'utf-8')
  const generatedBooks = readFileSync(join(SRC, 'data/books.ts'), 'utf-8')
  assert(admin.includes('supportLogo_') && admin.includes('descriptionDe'), 'Backend-Felder für unterstützte Werke fehlen')
  assert(admin.includes('addSupportOrganization') && admin.includes('supportFlyer_de_') && admin.includes('supportFlyer_en_'), 'Organisationen oder Flyer sind im Backend nicht erweiterbar')
  assert(section.includes('supportedOrganizations'), 'Unterstützungssektion ist nicht mit den Einstellungen verbunden')
  assert(section.includes('viewFlyer') && section.includes('<iframe'), 'Flyer können auf der Landingpage nicht angesehen werden')
  assert(server.includes('MAX_SUPPORTED_ORGANIZATIONS') && server.includes('supportFlyer_'), 'Flyer werden serverseitig nicht sicher verarbeitet')
  assert(generatedBooks.includes('supportedOrganizations:'), 'Automatisch erzeugte Seitendaten verlieren die unterstützten Werke')
})

test('Alle Frontend-Texte sind zweisprachig und im Backend bearbeitbar', () => {
  const defaults = JSON.parse(readFileSync(join(SRC, 'data/texts.defaults.json'), 'utf-8'))
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(defaults.de && defaults.en, 'Deutsche oder englische Standardtexte fehlen')
  for (const key of ['hero', 'books', 'trust', 'supportedWorks', 'about', 'support', 'faq', 'footer']) {
    assert(defaults.de[key] && defaults.en[key], `Textbereich ${key} fehlt`)
  }
  assert(admin.includes('frontendTextSections') && admin.includes('settings-panel'), 'Aufklappbare Textbearbeitung fehlt')
  assert(server.includes('frontendTexts'), 'Textänderungen werden nicht gespeichert/generiert')
})

test('Verwaiste Medien können sicher angesehen und gelöscht werden', () => {
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(admin.includes('orphan-grid') && admin.includes('deleteOrphans'), 'Vorschau oder Löschknopf für verwaiste Medien fehlt')
  assert(server.includes('/api/orphans/delete') && server.includes('name != Path(name).name'), 'Sicherer Lösch-Endpunkt für verwaiste Medien fehlt')
})

test('Sternebewertung ist reine Amazon-Anzeige und nicht lokal anklickbar', () => {
  assert(!srcText.includes('BookRating'), 'Alte interaktive Buchbewertung ist noch eingebunden')
  assert(!/lambking-rating-|localStorage\.setItem\([^)]*rating/i.test(srcText), 'Bewertung wird noch lokal gespeichert')
  assert(srcText.includes('amazonRating'), 'Amazon-Bewertung wird nicht angezeigt')
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
