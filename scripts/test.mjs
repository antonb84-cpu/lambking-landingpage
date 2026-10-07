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

test('Blätterbuch: bedienbar per Tippen/Tastatur, ohne Bildmenü, respektiert reduzierte Bewegung', () => {
  const flip = readFileSync(join(SRC, 'components/FlipBook.tsx'), 'utf-8')
  assert(flip.includes('draggable={false}'), 'Schutz vor dem mobilen Bildmenü fehlt')
  assert(flip.includes('prefers-reduced-motion'), 'Reduzierte Bewegung wird nicht beachtet')
  assert(flip.includes('aria-pressed={playing}') && flip.includes('aria-live="polite"'), 'Bedienelemente/Seitenanzeige nicht zugänglich')
  assert(flip.includes('IntersectionObserver'), 'Blätterbuch läuft auch außerhalb des Bildes')
  assert(!/<a[^>]*flip/i.test(flip), 'Blätterbuch ist ein Link')
})

test('Blätterbuch zeigt Titelseite (auch Druckbogen-Cover) und alle Seiten des Buches', () => {
  const flip = readFileSync(join(SRC, 'components/FlipBook.tsx'), 'utf-8')
  assert(flip.includes('coverFor(book, edition)') && flip.includes('flipPagesFor(book.id, sel)'), 'Cover/Seiten kommen nicht aus den Buchdaten')
  assert(flip.includes('flipLanguagesFor(book.id)') && flip.includes('aria-pressed={active}') && flip.includes('switchLang'), 'Sprach-Flaggen im Blätterbuch fehlen')
  assert(flip.includes('book.samples'), 'Fallback auf Vorschauseiten fehlt')
  const manifest = JSON.parse(readFileSync(join(SRC, 'data/flipbooks.json'), 'utf-8'))
  for (const [id, langs] of Object.entries(manifest)) {
    if (id.startsWith('_')) continue
    for (const [lang, entry] of Object.entries(langs)) {
      assert(existsSync(join(ROOT, 'public', entry.dir, 'p01.jpg')), `Blätterbuch ${id}/${lang}: Seite 1 fehlt`)
      assert(existsSync(join(ROOT, 'public', entry.dir, `p${String(entry.count).padStart(2, '0')}.jpg`)), `Blätterbuch ${id}/${lang}: letzte Seite fehlt`)
      if (entry.back) assert(existsSync(join(ROOT, 'public', entry.back)), `Blätterbuch ${id}/${lang}: Rückseite fehlt`)
    }
  }
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
    assert(Array.isArray(b.editions) && b.editions.length > 0, `${b.id}: keine Sprach-Ausgabe eingetragen`)
    const editionLanguages = new Set()
    for (const edition of b.editions) {
      assert(/^[a-z]{2,3}(-[a-z]{2})?$/.test(edition.language), `${b.id}: ungültiger Sprachcode`)
      assert(!edition.amazon || edition.amazon.startsWith('https://'), `${b.id}/${edition.language}: Amazon-Link ungültig`)
      assert(!editionLanguages.has(edition.language), `${b.id}: Sprache doppelt eingetragen`)
      editionLanguages.add(edition.language)
    }
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

test('Mehrsprachige Bücher besitzen ein eigenes, korrekt verknüpftes Cover je Sprache', () => {
  const booksView = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(booksView.includes('cover: coverFor(book, edition).src'), 'Sprachcover werden im Frontend nicht übernommen')
  assert(booksView.includes('<BookMediaGallery key=') && booksView.includes('book={displayBook}') && booksView.includes('<BookCover book={book}'), 'Buchgalerie verwendet nicht das gewählte Sprachcover')
  assert(admin.includes('Cover dieser Sprach-Ausgabe') && admin.includes("'coverSpread'"), 'Sprachcover sind im Backend nicht bearbeitbar')
  assert(server.includes('cleaned_edition["cover"]') && server.includes('cleaned_edition["coverSpread"]'), 'Server bewahrt Sprachcover beim Speichern nicht auf')

  for (const book of booksJson.books) {
    const editions = book.editions || []
    if (editions.length <= 1) continue
    const covers = []
    for (const edition of editions) {
      assert(edition.cover, `${book.id}/${edition.language}: eigenes Sprachcover fehlt`)
      assert(existsSync(join(ROOT, 'public', edition.cover)), `${book.id}/${edition.language}: Sprachcover-Datei fehlt (${edition.cover})`)
      covers.push(edition.cover)
    }
    assert(new Set(covers).size === covers.length, `${book.id}: mehrere Sprachen verwenden dasselbe Cover`)
  }
})

test('Band 10 zeigt die neuen 80-Seiten-Ausgaben in Deutsch, Englisch und Spanisch', () => {
  const book = booksJson.books.find((item) => item.id === 'bibelgeschichten-zum-ausmalen-2')
  assert(book?.detail.includes('80 Seiten') && book.age === 'Ab 6 Jahren', 'Band 10 hat veralteten Umfang oder Altersangabe')
  assert(book.lifestyleImages.length === 0, 'Veraltetes Foto des früheren Band-10-Covers wird noch gezeigt')
  assert(book.highlights.some((item) => item.includes('35 große Ausmalbilder')), '35 Motive fehlen in den Buchinformationen')
  assert(book.editions.map((item) => item.language).join(',') === 'de,en,es', 'Band 10 hat nicht alle drei Sprachausgaben')
  for (const edition of book.editions) {
    assert(edition.coverSpread && edition.cover?.includes(`band10-${edition.language}-spread`), `${edition.language}: neues Druckbogen-Cover fehlt`)
    assert(edition.samples?.length === 5, `${edition.language}: echte Vorschauseiten fehlen`)
    assert(edition.samples.every((sample) => existsSync(join(ROOT, 'public', sample))), `${edition.language}: Vorschauseite nicht gefunden`)
    assert(edition.highlights?.length || edition.language === 'de', `${edition.language}: übersetzte Buchinformationen fehlen`)
  }
})

test('Buchgalerie und kurze Inhaltsangaben sind pro Buch gepflegt', () => {
  const booksView = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  assert(booksView.includes('BookMediaGallery') && booksView.includes('onTouchEnd'), 'Wischbare Buchgalerie fehlt')
  const creation = booksJson.books.find((book) => book.id === 'bibelgeschichten-zum-ausmalen')
  assert(creation?.lifestyleImages?.includes('images/lifestyle/schoepfung-de-offen-rechts.png'), 'Korrigierte Buchansicht fehlt')
  assert(creation?.samples?.includes('images/schoepfung-de-originalseite-05.jpg'), 'Originalseite aus dem Buch fehlt')
  assert(!creation?.lifestyleImages?.includes('images/lifestyle/schoepfung-de-offen.png'), 'Falsche Doppelseite ist noch eingebunden')
  for (const book of booksJson.books) {
    assert(book.description?.length > 50, `${book.id}: kurze Inhaltsangabe fehlt`)
    assert(!/70 Seiten|70 pages|70 páginas|DIN A4|21,6 × 27,9/.test(book.description), `${book.id}: allgemeine Buchfakten stehen in der Geschichte`)
    if (book.id !== 'bibelgeschichten-zum-ausmalen-2') assert(book.lifestyleImages?.length, `${book.id}: Buchfoto fehlt`)
    for (const image of book.lifestyleImages) {
      const path = join(ROOT, 'public', image)
      assert(existsSync(path), `${book.id}: Buchfoto fehlt (${image})`)
      if (image.endsWith('.png')) {
        const bytes = readFileSync(path)
        assert(bytes.subarray(1, 4).toString('ascii') === 'PNG', `${book.id}: beschädigtes PNG (${image})`)
        assert(bytes.readUInt32BE(20) >= bytes.readUInt32BE(16), `${book.id}: Breitbild-Buchfoto (${image})`)
      }
    }
    if (book.previewVideo) assert(existsSync(join(ROOT, 'public', book.previewVideo)), `${book.id}: Vorschauvideo fehlt`)
  }
})

test('David und Weihnachten verwenden sprachrichtige Cover und PDF-Vorschauseiten', () => {
  const booksView = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(booksView.includes('samples: edition.samples?.length ? edition.samples : book.samples'), 'Sprachspezifische Vorschauseiten werden nicht verwendet')
  assert(booksView.includes('sources={displayBook?.samples ?? []}'), 'Vergrößerte Vorschau verwendet nicht die Sprach-Ausgabe')
  assert(readFileSync(join(SRC, 'data/languageMeta.ts'), 'utf-8').includes("flag-icons/flags/4x3/ro.svg"), 'Rumänische Flagge fehlt')
  assert(admin.includes('Vorschauseiten dieser Sprache') && admin.includes("['ro','🇷🇴 Rumänisch']"), 'Sprach-Vorschauseiten oder Rumänisch fehlen im Backend')
  assert(server.includes('cleaned_edition["samples"]'), 'Backend verwirft Sprach-Vorschauseiten beim Speichern')
  for (const [id, languages] of [
    ['david', ['de', 'en', 'es', 'ro']],
    ['bibelgeschichten-zum-ausmalen-3', ['de', 'en', 'es']],
  ]) {
    const book = booksJson.books.find((item) => item.id === id)
    assert(book, `${id}: Buch fehlt`)
    assert(languages.every((language) => book.editions.some((edition) => edition.language === language)), `${id}: Sprach-Ausgabe fehlt`)
    for (const edition of book.editions) {
      assert(edition.cover && existsSync(join(ROOT, 'public', edition.cover)), `${id}/${edition.language}: Cover fehlt`)
      assert(edition.samples?.length === 6, `${id}/${edition.language}: es müssen sechs Vorschauseiten vorhanden sein`)
      for (const path of edition.samples) {
        assert(path.includes(`-${edition.language}-preview-`), `${id}/${edition.language}: Vorschauseite in falscher Sprache (${path})`)
        assert(existsSync(join(ROOT, 'public', path)), `${id}/${edition.language}: Vorschauseite fehlt (${path})`)
      }
    }
  }
})

test('Vorschauseiten lassen sich ordnen und ein Hero-Buch auswählen', () => {
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const hero = readFileSync(join(SRC, 'components/FlipBook.tsx'), 'utf-8') + readFileSync(join(SRC, 'data/featured.ts'), 'utf-8')
  assert(admin.includes('sampleOrder') && admin.includes('moveSampleItem'), 'Sortierung der Vorschauseiten fehlt')
  assert(admin.includes('fbSetFeatured') && server.includes('/api/flipbook/featured'), 'Auswahl des Vorschaubuchs fehlt im Backend')
  assert(server.includes('MAX_SAMPLE_IMAGES = 10') && server.includes('sampleOrder'), 'Server begrenzt/sortiert Vorschauseiten nicht korrekt')
  assert(hero.includes('book.showInHero') && hero.includes('book.samples'), 'Vorschaubuch verwendet die gewählte Vorschau nicht')
  assert(hero.includes('hasFlipbook'), 'Vorschaubuch bevorzugt kein Buch mit komplettem Blätterbuch')
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
  if (booksJson.site.analyticsUrl) {
    assert(ds.includes('Anonyme Reichweitenmessung') && ds.includes('Cloudflare'), 'Aktiver Zähldienst fehlt in der Datenschutzerklärung')
  }
})

test('App-Datenschutz ist enthalten und unter der Store-URL erreichbar', () => {
  const ds = booksJson.site.datenschutz || ''
  const legalGenerator = readFileSync(join(ROOT, 'scripts/gen-legal.mjs'), 'utf-8')
  const postbuild = readFileSync(join(ROOT, 'scripts/postbuild.mjs'), 'utf-8')
  const previewServer = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(ds.includes('Nutzung der App „LambKing Stories“'), 'App-Abschnitt fehlt')
  assert(ds.includes('Render Services') && ds.includes('MongoDB Atlas'), 'App-Hosting fehlt')
  const appSection = ds.split('8. Nutzung der App „LambKing Stories“')[1]?.split('9. Ihre Rechte')[0] || ''
  assert(!appSection.includes('zufällige Kennung') && !appSection.includes('pro Kennung') && !appSection.includes('13 Monaten'), 'Die entfernte Gerätekennung wird noch im App-Abschnitt beschrieben')
  assert(appSection.includes('Anonyme Buchdetailseiten-Aufrufe') && appSection.includes('gemeinsame Tagessummen'), 'Anonyme tägliche Buchdetailseiten-Zählung fehlt')
  assert(appSection.includes('keine persönlichen Informationen oder Nutzerkennungen') && appSection.includes('keine Wiedererkennung'), 'Datensparsame App-Zählung ist nicht beschrieben')
  assert(appSection.includes('Freiwillige einmalige Apple-In-App-Trinkgelder') && appSection.includes('Zahlungsabwicklung erfolgt über Apple'), 'Einmalige freiwillige Apple-Trinkgelder fehlen im App-Datenschutz')
  assert(!appSection.includes('keine In-App-Käufe'), 'Veraltete Aussage über fehlende In-App-Käufe')
  assert(!appSection.includes('Abfrage für Erwachsene'), 'Die entfernte Elternabfrage wird noch beschrieben')
  assert(ds.includes('9. Ihre Rechte'), 'Rechte-Abschnitt wurde nicht korrekt verschoben')
  assert(legalGenerator.includes("join(privacyDir, 'index.html')"), 'Die Route /datenschutz/ wird nicht erzeugt')
  assert(postbuild.includes("'datenschutz/'"), 'Die Store-URL fehlt in der Sitemap')
  assert(previewServer.includes('"datenschutz/index.html"'), 'Die lokale Vorschau aktualisiert die Datenschutzroute nicht')
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
  assert(section.includes('items-center justify-center rounded-xl'), 'Logos sind nicht mittig ausgerichtet')
  assert(!section.includes('line-clamp-6'), 'Beschreibung der unterstützten Werke wird abgeschnitten')
  assert(section.includes('aria-haspopup="dialog"') && section.includes('justify-center gap-x-5') && section.includes('text-sm font-bold'), 'Flyer ist kein zentrierter, fetter Textlink')
  assert(section.includes('aria-expanded={open}') && section.includes('{open ? less : more}'), 'Vollständige Beschreibung ist nicht über „Mehr lesen“ erreichbar')
  assert(section.includes('viewFlyer') && section.includes('<iframe'), 'Flyer können auf der Landingpage nicht angesehen werden')
  assert(server.includes('MAX_SUPPORTED_ORGANIZATIONS') && server.includes('supportFlyer_'), 'Flyer werden serverseitig nicht sicher verarbeitet')
  assert(generatedBooks.includes('supportedOrganizations:'), 'Automatisch erzeugte Seitendaten verlieren die unterstützten Werke')
})

test('Ausgeblendete Bücher bleiben im Admin, erscheinen aber nicht auf der Seite', () => {
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const adminUi = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const post = readFileSync(join(ROOT, 'scripts/postbuild.mjs'), 'utf-8')
  assert(server.includes('/api/visibility') && server.includes('not x.get("hidden")'), 'Backend kann Bücher nicht ausblenden')
  assert(adminUi.includes('setBookVisible') && adminUi.includes('id="f_visible"'), 'Schalter zum Ein-/Ausblenden fehlt im Backend')
  assert(post.includes('!b.hidden'), 'Ausgeblendete Bücher stehen noch in den Suchmaschinen-Daten')
  const generated = readFileSync(join(SRC, 'data/books.ts'), 'utf-8')
  for (const b of booksJson.books) {
    const inSite = generated.includes(`id: '${b.id}'`)
    assert(inSite === !b.hidden, `${b.id}: ${b.hidden ? 'ausgeblendet, steht aber auf der Seite' : 'sichtbar, fehlt aber auf der Seite'}`)
  }
  assert(booksJson.books.some((b) => !b.hidden), 'Alle Bücher sind ausgeblendet')
})

test('Startseiten-Medien kommen aus den Seitendaten, sind vollständig vorhanden und Bereiche lassen sich ausblenden', () => {
  const generated = readFileSync(join(SRC, 'data/books.ts'), 'utf-8')
  const app = readFileSync(join(SRC, 'App.tsx'), 'utf-8')
  const family = readFileSync(join(SRC, 'sections/Family.tsx'), 'utf-8')
  const freebie = readFileSync(join(SRC, 'sections/Freebie.tsx'), 'utf-8')
  const carousel = readFileSync(join(SRC, 'components/PhoneCarousel.tsx'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const adminUi = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  for (const id of ['tryit', 'app', 'supportedWorks']) assert(app.includes(`hiddenSections.includes('${id}')`), `Bereich „${id}" lässt sich nicht ausblenden`)
  assert(family.includes('SITE.kidsVideos') && family.includes("hiddenSections.includes('kids')") && family.includes("hiddenSections.includes('freebie')"), 'Kinder-Videos/Gratis-Ausmalbild kommen nicht aus den Seitendaten')
  assert(freebie.includes('SITE.freebie.pdf') && freebie.includes('SITE.freebie.preview'), 'Gratis-Ausmalbild nutzt feste Dateinamen')
  assert(carousel.includes('SITE.appScreens'), 'App-Screenshots kommen nicht aus den Seitendaten')
  const heroSrc = readFileSync(join(SRC, 'sections/Hero.tsx'), 'utf-8')
  assert(heroSrc.includes('SITE.hero') && heroSrc.includes('--hero-pos-d') && heroSrc.includes("textTone === 'light'"), 'Titelbild-Einstellungen (Schrift, Ausschnitt) werden nicht verwendet')
  assert(adminUi.includes('id="tab-medien"') && server.includes('/api/media/'), 'Medien-Bereich fehlt im Backend')
  const grab = (key) => {
    const match = generated.match(new RegExp(String.raw`${key}: (\[.*?\]|\{.*?\})(?: as [^\r\n]*)?,\r?\n`, 's'))
    assert(match, `${key} fehlt in den Seitendaten`)
    return JSON.parse(match[1])
  }
  const files = [
    ...grab('kidsVideos').flatMap((item) => [item.src, item.poster]),
    ...Object.values(grab('freebie')),
    ...grab('appScreens').map((item) => item.src),
  ]
  assert(files.length >= 10, 'Medienlisten sind unerwartet leer')
  for (const rel of files) assert(existsSync(join(ROOT, 'public', rel)), `Datei der Startseite fehlt: ${rel}`)
  assert(['hero-titel-breit.jpg', 'hero-titel.jpg', 'hero-titel-mobil.jpg'].every((name) => existsSync(join(ROOT, 'public/images', name))), 'Titelbild-Dateien fehlen')
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

test('Fettschrift ist im Backend auswählbar und wird sicher gerendert', () => {
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const richText = readFileSync(join(SRC, 'components/RichText.tsx'), 'utf-8')
  assert(admin.includes('formatSelectedTextBold') && admin.includes('text-format-toolbar'), 'Fettschrift-Werkzeug fehlt im Backend')
  assert(richText.includes("part.startsWith('**')") && richText.includes('<strong'), 'Fettschrift-Markierung wird nicht gerendert')
  assert(!richText.includes('dangerouslySetInnerHTML'), 'Rich-Text darf kein frei ausführbares HTML verwenden')
})

test('Auf Smartphones stehen zwei Bücher nebeneinander', () => {
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  assert(books.includes('grid grid-cols-2'), 'Mobile Buchübersicht hat keine zwei Spalten')
})

test('Alle Malbücher zeigen einheitlich Umfang (mindestens 70 Seiten), Format und Rätselseiten', () => {
  const defaults = JSON.parse(readFileSync(join(SRC, 'data/texts.defaults.json'), 'utf-8'))
  const booksSection = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const coloringBooks = booksJson.books.filter((book) => book.category === 'malbuecher')
  assert(coloringBooks.length > 0, 'Keine Malbücher zum Prüfen gefunden')
  for (const book of coloringBooks) {
    const coverAge = ['bibelgeschichten-zum-ausmalen-4', 'bibelgeschichten-zum-ausmalen-5'].includes(book.id) ? 'Ab 5 Jahren' : 'Ab 6 Jahren'
    assert(book.age === coverAge, `${book.title}: Altersangabe passt nicht zum aktuellen Cover`)
    assert(book.detail.includes(book.id === 'bibelgeschichten-zum-ausmalen-2' ? '80 Seiten' : '70 Seiten'), `${book.title}: Seitenzahl passt nicht zur Ausgabe`)
  }
  for (const lang of ['de', 'en']) {
    const texts = defaults[lang].books
    assert(texts.coloringFactsTitle, `${lang}: Überschrift zu den Malbuch-Eigenschaften fehlt`)
    assert(Array.isArray(texts.coloringFacts) && texts.coloringFacts.length === 5, `${lang}: Es müssen genau fünf Malbuch-Eigenschaften vorhanden sein`)
    assert(texts.coloringFacts[0] === (lang === 'de' ? 'Mindestens 70 Seiten' : 'At least 70 pages'), `${lang}: Seitenzahl-Aussage fehlt`)
  }
  assert(booksSection.includes('ColoringBookFacts') && !booksSection.includes('coloringCardSummary'), 'Malbuch-Kurzinfo steht noch wiederholt auf den Kacheln')
  assert(!booksSection.includes('<ColoringBookFacts compact'), 'Malbuch-Faktenkasten wird im Buchfenster wiederholt')
  assert(admin.includes("coloringFactsTitle:") && !admin.includes("coloringCardSummary:"), 'Überflüssige Malbuch-Kurzinfo steht noch im Backend')
})

test('Buchfenster bietet einen barrierearmen Mengenrabatt mit E-Mail-Kontakt an', () => {
  const defaults = JSON.parse(readFileSync(join(SRC, 'data/texts.defaults.json'), 'utf-8'))
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  for (const lang of ['de', 'en']) {
    const texts = defaults[lang].books
    assert(texts.bulkDiscountButton && texts.bulkDiscountTitle, `${lang}: Mengenrabatt-Texte fehlen`)
    assert(texts.bulkDiscountContactButton && texts.bulkDiscountCopying && texts.bulkDiscountCopied && texts.bulkDiscountOpenMail, `${lang}: Mengenrabatt-Kontakttexte fehlen`)
  }
  for (const value of ['quantity: 10, discount: 15', 'quantity: 25, discount: 25', 'quantity: 50, discount: 35', 'quantity: 100, discount: 40']) {
    assert(books.includes(value), `Rabattstaffel fehlt: ${value}`)
  }
  assert(books.includes('<table') && books.includes('scope="col"'), 'Barrierearme Rabatttabelle fehlt')
  assert(books.includes('navigator.clipboard?.writeText') && books.includes("document.execCommand('copy')"), 'Zuverlässiges Kopieren der E-Mail-Adresse fehlt')
  assert(books.includes('Promise.race') && books.includes('bulkDiscountCopying'), 'Zeitbegrenzung oder sofortige Kopier-Rückmeldung fehlt')
  assert(books.includes('mailto:${SITE.contactEmail}') && books.includes('bulkDiscountEmailSubject'), 'Optionaler Link zum E-Mail-Programm fehlt')
  assert(books.includes('aria-live="polite"') && books.includes('bulkDiscountCopied'), 'Sichtbare und barrierearme Kopierbestätigung fehlt')
  assert(admin.includes('bulkDiscountButton:') && admin.includes('bulkDiscountEmailSubject:') && admin.includes('bulkDiscountCopied:'), 'Mengenrabatt-Texte sind im Backend nicht beschriftet')
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

test('Anonyme Statistik speichert keine Besucherkennungen', () => {
  const analytics = readFileSync(join(SRC, 'data/analytics.ts'), 'utf-8')
  const app = readFileSync(join(SRC, 'App.tsx'), 'utf-8')
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const worker = readFileSync(join(ROOT, 'analytics-worker/src/index.js'), 'utf-8')
  const schema = readFileSync(join(ROOT, 'analytics-worker/schema.sql'), 'utf-8')
  const adminServer = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(app.includes('trackPageView()'), 'Seitenaufruf wird nicht gezählt')
  assert(books.includes('trackAmazonClick(book.id, edition.language)'), 'Amazon-Klick je Buch und Sprach-Ausgabe wird nicht gezählt')
  // Jedes Klickziel muss vom Zähldienst akzeptiert werden (früher wurde „buch:de" verworfen – dadurch fehlten alle Klicks)
  const pattern = new RegExp(worker.match(/const TARGET_PATTERN = \/(.*)\/\r?\n/)[1])
  const frontPattern = new RegExp(analytics.match(/const TARGET_PATTERN = \/(.*)\//)[1])
  const books_ = JSON.parse(readFileSync(join(SRC, 'data/books.json'), 'utf-8')).books
  for (const book of books_) {
    for (const edition of book.editions ?? []) {
      const target = `${book.id}-${edition.language}`
      assert(pattern.test(target) && frontPattern.test(target), `Klickziel „${target}" wird vom Zähler abgelehnt`)
    }
  }
  assert(analytics.includes('isLocalPreview()') && /localhost/.test(analytics) && analytics.includes('if (!url || isLocalPreview()) return'), 'Lokale Vorschau zählt mit und verfälscht die Statistik')
  assert(analytics.includes('counterSelfTest') && readFileSync(join(SRC, 'App.tsx'), 'utf-8').includes("has('zaehler-test')"), 'Zähler-Selbsttest fehlt')
  const ratingSrc = readFileSync(join(SRC, 'components/AmazonRating.tsx'), 'utf-8')
  assert(ratingSrc.includes('trackAmazonClick(book.id, book.lang)'), 'Klick auf die Sterne (führt zu Amazon) wird nicht gezählt')
  for (const file of ['sections/Books.tsx', 'components/PaypalButton.tsx', 'components/KofiButton.tsx', 'sections/AppSection.tsx', 'components/AmazonRating.tsx']) {
    assert(readFileSync(join(SRC, file), 'utf-8').includes('onAuxClick'), `${file}: Klick mit der mittleren Maustaste wird nicht gezählt`)
  }
  // Admin-Programm und Oberfläche müssen dieselbe Version haben, sonst läuft noch ein altes Programm
  const serverVersion = adminServer.match(/ADMIN_VERSION = "([^"]+)"/)?.[1]
  const uiVersion = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8').match(/const ADMIN_VERSION = '([^']+)'/)?.[1]
  assert(serverVersion && serverVersion === uiVersion, `Admin-Version stimmt nicht überein (${serverVersion} / ${uiVersion})`)
  for (const link of ['paypal', 'kofi', 'playstore', 'appstore']) {
    assert(pattern.test(`link-${link}`), `Klickziel link-${link} wird vom Zähler abgelehnt`)
  }
  for (const [file, name] of [['components/PaypalButton.tsx', 'paypal'], ['components/KofiButton.tsx', 'kofi'], ['sections/AppSection.tsx', 'playstore'], ['sections/AppSection.tsx', 'appstore']]) {
    assert(readFileSync(join(SRC, file), 'utf-8').includes(`trackLinkClick('${name}')`), `Klicks auf ${name} werden nicht gezählt`)
  }
  assert(!/localStorage|sessionStorage|document\.cookie|fingerprint/i.test(analytics), 'Frontend-Zähler verwendet eine Wiedererkennungstechnik')
  assert(!/user.agent|cf-connecting-ip|x-forwarded-for|referer|referrer/i.test(worker), 'Worker liest unnötige Besucherdaten')
  assert(schema.includes('PRIMARY KEY (day, event_type, target_id)'), 'Datenbank speichert keine reinen Tagessummen')
  assert(worker.includes('count = count + 1') && schema.includes("event_type IN ('pageview', 'amazon_click')"), 'Zählereignisse sind nicht eng begrenzt')
  assert(adminServer.includes('ANALYTICS_LOCAL_JSON') && adminServer.includes('Authorization'), 'Geschützte Admin-Abfrage fehlt')
  assert(!readFileSync(join(SRC, 'data/books.ts'), 'utf-8').includes('ADMIN_TOKEN'), 'Geheimes Statistik-Token steht in der Landingpage')
})

test('Sprach-Ausgaben öffnen erst ihre Infobox und verknüpfen dort Amazon', () => {
  const books = readFileSync(join(SRC, 'sections/Books.tsx'), 'utf-8')
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  assert(books.includes('LanguageEditions') && books.includes('LANGUAGE_META'), 'Sprachflaggen fehlen auf der Landingpage')
  assert(
    books.includes('onClick={() => onSelect(edition.language)}')
      && books.includes('onSelect={(language) => openBook(b, language)}')
      && books.includes('type="button"'),
    'Sprachflagge öffnet nicht zuerst die passende Buch-Infobox',
  )
  assert(books.includes('title: edition.title || book.title') && books.includes('description: edition.description || book.description'), 'Übersetzte Infobox-Inhalte werden nicht verwendet')
  assert(admin.includes('addBookEdition') && admin.includes("fd.append('editions'"), 'Sprach-Ausgaben lassen sich im Backend nicht pflegen')
  assert(server.includes('submitted_editions') && server.includes('book["editions"]'), 'Backend speichert Sprach-Ausgaben nicht')
})

test('Statistikmodul ist vollständig portabel mit Einrichtung und deaktivierten Aufruflogs', () => {
  assert(!existsSync(join(ROOT, 'ANALYTIK-EINRICHTEN.bat')), 'Im Hauptordner liegt noch ein zweiter sichtbarer Startpunkt')
  assert(existsSync(join(ROOT, 'analytics-worker/ZAeHLER-WARTUNG.bat')), 'Interne Zähler-Wartungsdatei fehlt')
  assert(existsSync(join(ROOT, 'analytics-worker/wrangler.template.toml')), 'Portable Worker-Konfiguration fehlt')
  assert(existsSync(join(ROOT, 'analytics-worker/setup.mjs')), 'Automatische Einrichtung fehlt')
  const config = readFileSync(join(ROOT, 'analytics-worker/wrangler.template.toml'), 'utf-8')
  assert(config.includes('[observability]') && config.includes('enabled = false') && config.includes('invocation_logs = false'), 'Cloudflare-Aufrufprotokolle sind nicht deaktiviert')
  assert(config.includes('database_id = "__DATABASE_ID__"'), 'Datenbank ist unerlaubt an ein bestimmtes Konto gebunden')
  const setup = readFileSync(join(ROOT, 'analytics-worker/setup.mjs'), 'utf-8')
  assert(setup.includes("['login', '--device']"), 'Portable Cloudflare-Geräteanmeldung fehlt')
  const adminStart = readFileSync(join(ROOT, 'ADMIN-STARTEN.bat'), 'utf-8')
  const analyticsStart = readFileSync(join(ROOT, 'analytics-worker/ZAeHLER-WARTUNG.bat'), 'utf-8')
  assert(adminStart.includes('runtime\\python\\python.exe') && adminStart.includes('runtime\\node\\node.exe') && adminStart.includes('runtime\\mingit\\cmd\\git.exe'), 'Admin bevorzugt die mitgelieferten Programme nicht')
  assert(adminStart.includes('analytics.local.json') && adminStart.includes('analytics-worker\\ZAeHLER-WARTUNG.bat --from-admin'), 'Zähler-Einrichtung ist nicht in den Admin-Start integriert')
  assert(analyticsStart.includes('runtime\\node\\node.exe') && analyticsStart.includes('node_modules\\wrangler'), 'Zähler-Einrichtung verwendet die portable Laufzeit nicht')
  const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8')
  assert(ignore.includes('admin/analytics.local.json'), 'Lokales Statistik-Token ist nicht von Git ausgeschlossen')
  assert(ignore.includes('/runtime/'), 'Portable Programmlaufzeiten würden versehentlich zu GitHub übertragen')
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

test('Creator-Partner-Seite ist zweisprachig und verwendet die korrekte Vergütungsbasis', () => {
  const texts = JSON.parse(readFileSync(join(SRC, 'data/texts.defaults.json'), 'utf-8'))
  const page = readFileSync(join(SRC, 'pages/CreatorPartnerPage.tsx'), 'utf-8')
  const de = texts.de.creatorPartner
  const en = texts.en.creatorPartner
  assert(de.heroTitle === 'Werde Creator- oder Influencer-Partner von LambKing Stories', 'Deutscher Seitentitel fehlt')
  assert(en.heroTitle === 'Become a LambKing Stories Creator or Influencer Partner', 'Englischer Seitentitel fehlt')
  assert(de.compensationRate.includes('10 %') && de.compensationRate.includes('KDP-Tantieme'), 'Deutsche Vergütungsformulierung ist unvollständig')
  assert(!de.compensationRate.toLowerCase().includes('verkaufspreis'), 'Vergütung wird fälschlich auf den Verkaufspreis bezogen')
  assert(en.compensationRate.includes('10%') && en.compensationRate.includes('KDP royalty'), 'Englische Vergütungsformulierung ist unvollständig')
  const mail = readFileSync(join(SRC, 'data/creatorApplication.ts'), 'utf-8')
  assert(page.includes('creatorApplicationMailto') && page.includes('window.location.href = emailUrl'), 'Direkte E-Mail-Übergabe fehlt')
  assert(!mail.includes('fetch(') && !srcText.includes('VITE_CREATOR_APPLICATION_ENDPOINT'), 'Creator-Formular überträgt Daten über einen Webdienst')
  assert(page.includes('form.checkValidity()') && page.includes('form.reportValidity()'), 'Formularvalidierung fehlt')
  assert(booksJson.site.datenschutz.includes('Creator-Bewerbungsformular speichert und übermittelt selbst keine Angaben'), 'Datenschutzhinweis zur E-Mail-Bewerbung fehlt')
})

test('Creator-Partner-Route erhält eigene SEO-Daten ohne alte GitHub-Canonical', () => {
  const lang = readFileSync(join(SRC, 'data/lang.ts'), 'utf-8')
  const postbuild = readFileSync(join(ROOT, 'scripts/postbuild.mjs'), 'utf-8')
  assert(lang.includes("canonical: 'https://lambking.store/creator-partner/'"), 'Dynamische Canonical-URL der Creator-Seite fehlt')
  assert(postbuild.includes("join(DIST, 'creator-partner')") && postbuild.includes("writeFileSync(join(creatorDir, 'index.html')"), 'Statische Creator-Partner-Route wird nicht erzeugt')
  assert(postbuild.includes('<base href="../" />'), 'Asset-Basis der Unterseite fehlt')
  assert(!indexHtml.includes('antonb84-cpu.github.io/lambking-landingpage'), 'Alte GitHub-Pages-Canonical steht noch in index.html')
  assert(booksJson.site.publicUrl === 'https://lambking.store/', 'Öffentliche Projekt-URL zeigt nicht auf lambking.store')
})

test('Alle LambKing-Logos verwenden die neue gemeinsame Bilddatei', () => {
  const asset = 'images/lambking-stories-logo-v2.png'
  // Kopf- und Fußzeile nutzen die kleine WebP-Fassung, das Original-PNG bleibt für Rechtsseiten und Admin
  const variants = ['lambking-stories-logo-v2', 'logo-icon-96']
  const files = [
    'src/sections/Header.tsx',
    'src/sections/Footer.tsx',
    'index.html',
    'scripts/gen-legal.mjs',
    'admin/index.html',
  ]
  assert(existsSync(join(ROOT, 'public', asset)) && existsSync(join(ROOT, 'public/images/lambking-stories-logo-v2-256.webp')) && existsSync(join(ROOT, 'public/images/logo-icon-96.png')), 'Neue Logo-Dateien fehlen')
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), 'utf-8')
    assert(variants.some((name) => source.includes(`images/${name}`)), `Neues Logo fehlt in ${file}`)
    assert(!/images\/(?:logo\.webp|lambking-logo(?:-2026)?\.png|lambking-stories-logo\.png|app-logo\.png|lamm-kopf\.png)/.test(source), `Alte Logo-Datei wird noch in ${file} verwendet`)
  }
})

test('Creator-Bewerbungsseite ist im portablen Backend vollständig schaltbar', () => {
  const admin = readFileSync(join(ROOT, 'admin/index.html'), 'utf-8')
  const server = readFileSync(join(ROOT, 'admin/admin_server.py'), 'utf-8')
  const app = readFileSync(join(SRC, 'App.tsx'), 'utf-8')
  const header = readFileSync(join(SRC, 'sections/Header.tsx'), 'utf-8')
  const footer = readFileSync(join(SRC, 'sections/Footer.tsx'), 'utf-8')
  const teaser = readFileSync(join(SRC, 'sections/CreatorPartnerTeaser.tsx'), 'utf-8')
  const lang = readFileSync(join(SRC, 'data/lang.ts'), 'utf-8')
  const generated = readFileSync(join(SRC, 'data/books.ts'), 'utf-8')
  const postbuild = readFileSync(join(ROOT, 'scripts/postbuild.mjs'), 'utf-8')

  assert(typeof booksJson.site.creatorPartnerEnabled === 'boolean', 'Portable Creator-Einstellung fehlt in books.json')
  assert(admin.includes('id="s_creatorPartnerEnabled"'), 'Creator-Schalter fehlt im Backend')
  assert(admin.includes("fd.append('creatorPartnerEnabled'"), 'Creator-Schalter wird vom Backend nicht gesendet')
  assert(server.includes("s.get('creatorPartnerEnabled', True)"), 'Creator-Einstellung wird nicht in books.ts erzeugt')
  assert(server.includes('state["site"]["creatorPartnerEnabled"]'), 'Creator-Einstellung wird nicht dauerhaft gespeichert')
  assert(server.includes('if rel.endswith("/")') && server.includes('"creator-partner/index.html"'), 'Creator-Unterseite ist in der lokalen Vorschau nicht erreichbar')
  assert(server.includes('origin/main..HEAD') && server.includes('Ein vorheriger Push kann fehlgeschlagen sein'), 'Fehlgeschlagene GitHub-Übertragungen können nicht erneut gesendet werden')
  assert(generated.includes('creatorPartnerEnabled: true'), 'Aktivierte Creator-Einstellung fehlt in den generierten Frontend-Daten')
  assert(app.includes('SITE.creatorPartnerEnabled && isCreatorPartnerPath()'), 'Creator-Route wird im Frontend nicht abgeschaltet')
  assert(header.includes('SITE.creatorPartnerEnabled') && footer.includes('SITE.creatorPartnerEnabled'), 'Creator-Navigation wird nicht vollständig abgeschaltet')
  assert(header.includes("label: t.creatorPartner.navLabel") && header.includes("href: creatorPartnerHref()"), 'Creator-Link fehlt in der allgemeinen Header-Navigation')
  assert(app.indexOf('<SupportedWorks />') < app.indexOf('<CreatorPartnerTeaser />') && app.indexOf('<CreatorPartnerTeaser />') < app.indexOf('<Faq />'), 'Creator-Rubrik steht nicht vor den häufigen Fragen')
  assert(app.includes('SITE.creatorPartnerEnabled ? <CreatorPartnerTeaser /> : null'), 'Creator-Rubrik beachtet den Backend-Schalter nicht')
  assert(teaser.includes('creatorPartnerHref()') && teaser.includes('cp.applyNow'), 'Creator-Rubrik führt nicht zur Bewerbungsseite')
  assert(lang.includes('SITE.creatorPartnerEnabled && isCreatorPartnerPath()'), 'SEO-Metadaten beachten den Creator-Schalter nicht')
  assert(postbuild.includes("...(creatorPartnerEnabled ? ['creator-partner/'] : [])"), 'Sitemap beachtet den Creator-Schalter nicht')
  assert(postbuild.includes('if (creatorPartnerEnabled) {'), 'Produktionsroute wird trotz ausgeschalteter Funktion erzeugt')
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
