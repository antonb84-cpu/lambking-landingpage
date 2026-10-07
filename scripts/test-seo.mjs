// Prüft nach dem Build die eigenen Buchseiten (dist/buch/<name>/) und die Sitemap.
// Aufruf: npm run test:seo (läuft in "npm run check" nach dem Build)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bookSlugs } from '../src/data/bookSlug.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const BASE = data.site.publicUrl.replace(/\/$/, '')
const visible = data.books.filter((b) => !b.hidden)
const hidden = data.books.filter((b) => b.hidden)
const slugs = bookSlugs(visible)

let failed = 0
let passed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    console.log(`  ✗ ${name}\n      ${error.message}`)
  }
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

console.log('\nSEO-Seiten der Bücher\n')

test('Jedes sichtbare Buch hat einen eigenen, eindeutigen Pfad', () => {
  const values = Object.values(slugs)
  assert(new Set(values).size === values.length, 'doppelte Pfade')
  for (const value of values) assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length >= 3, `ungültiger Pfad „${value}"`)
})

test('Ausgeblendete Bücher haben keine Seite und stehen nicht in der Sitemap', () => {
  const folders = existsSync(join(DIST, 'buch')) ? readdirSync(join(DIST, 'buch')) : []
  assert(folders.length === visible.length, `${folders.length} Seiten für ${visible.length} sichtbare Bücher`)
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf-8')
  const hiddenSlugs = bookSlugs(hidden)
  for (const slug of Object.values(hiddenSlugs)) {
    assert(!existsSync(join(DIST, 'buch', slug)), `Seite für ausgeblendetes Buch „${slug}" vorhanden`)
    assert(!sitemap.includes(`/buch/${slug}/`), `ausgeblendetes Buch „${slug}" steht in der Sitemap`)
  }
})

for (const book of visible) {
  const slug = slugs[book.id]
  test(`Buchseite „${slug}": Titel, Canonical, Beschreibung, Strukturdaten, Text, Amazon`, () => {
    const file = join(DIST, 'buch', slug, 'index.html')
    assert(existsSync(file), 'Seite fehlt')
    const html = readFileSync(file, 'utf-8')
    const url = `${BASE}/buch/${slug}/`
    assert(html.includes('<base href="../../" />'), 'Basis-Pfad fehlt (Bilder und Skripte würden nicht laden)')
    assert(html.includes(`<title>${book.title.replace(/&/g, '&amp;')} | ${data.site.brand}</title>`), 'Titel fehlt')
    assert(html.includes(`<link rel="canonical" href="${url}" />`), 'Canonical zeigt nicht auf die Buchseite')
    assert(html.includes(`<meta property="og:url" content="${url}" />`), 'og:url fehlt')
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
    assert(description.length >= 40 && description.length <= 170, `Beschreibung hat ${description.length} Zeichen`)
    assert(new RegExp(`<html lang="${book.lang}"`).test(html), 'Sprache der Seite stimmt nicht mit dem Buch überein')
    assert(/<h1>/.test(html) && html.includes(`<h1>${book.title.replace(/&/g, '&amp;')}</h1>`), 'Überschrift im Text fehlt')
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '{}')['@graph'] ?? []
    const bookLd = graph.find((item) => item['@type'] === 'Book')
    assert(bookLd && bookLd.name === book.title && bookLd.url === url, 'Book-Strukturdaten fehlen oder sind falsch')
    assert(graph.some((item) => item['@type'] === 'BreadcrumbList' && item.itemListElement.length === 3), 'Brotkrumen fehlen')
    if (typeof book.amazonRating === 'number' && (book.amazonRatingCount ?? 0) > 0) {
      assert(bookLd.aggregateRating?.ratingValue === book.amazonRating, 'Bewertung stimmt nicht mit den Buchdaten überein')
    } else {
      assert(!bookLd.aggregateRating, 'Bewertung ohne echte Amazon-Daten')
    }
    for (const edition of book.editions ?? []) {
      if (edition.amazon?.startsWith('https://')) assert(html.includes(`href="${edition.amazon}"`), `Amazon-Link (${edition.language}) fehlt im Text`)
    }
    const shareImage = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? ''
    assert(/\.(jpg|png)$/.test(shareImage) && existsSync(join(DIST, shareImage.replace(BASE + '/', ''))), `Vorschaubild zum Teilen fehlt: ${shareImage}`)
    assert(!/og:image:width/.test(html), 'Bildgröße der Startseite würde zum Buchbild angegeben')
    assert(html.includes('<div id="root"><main'), 'Text für Suchmaschinen ohne JavaScript fehlt')
    assert(readFileSync(join(DIST, 'sitemap.xml'), 'utf-8').includes(`<loc>${url}</loc>`), 'Seite fehlt in der Sitemap')
  })
}

test('Startseite behält ihre eigenen Daten (Canonical, Strukturdaten)', () => {
  const html = readFileSync(join(DIST, 'index.html'), 'utf-8')
  assert(html.includes(`<link rel="canonical" href="${BASE}/" />`), 'Canonical der Startseite verändert')
  assert(html.includes('"@type":"FAQPage"'), 'FAQ-Strukturdaten fehlen')
  assert(!html.includes('<base href="../../"'), 'Startseite hat den Basis-Pfad der Buchseiten')
})

console.log(`\n  ${passed} bestanden, ${failed} fehlgeschlagen\n`)
if (failed) process.exit(1)
