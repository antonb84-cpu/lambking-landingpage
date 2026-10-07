// Post-Build: erzeugt aus den echten Projektdaten (src/data/books.json)
//  - JSON-LD Structured Data in dist/index.html (nur reale Daten)
//  - eine eigene statische Seite je sichtbarem Buch: dist/buch/<name>/index.html (Titel, Beschreibung, JSON-LD, Text)
//  - robots.txt / sitemap.xml
// (impressum.html/datenschutz.html erzeugt scripts/gen-legal.mjs vor dev/build)
// Läuft automatisch am Ende von "npm run build" – lokal und in GitHub Actions.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bookSlugs, splitTitle } from '../src/data/bookSlug.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const site = data.site
const BASE = (site.publicUrl || '').replace(/\/$/, '')
const creatorPartnerEnabled = site.creatorPartnerEnabled !== false

// ── JSON-LD Structured Data (nur reale Daten) ─────────────────
const defaultTexts = JSON.parse(readFileSync(join(ROOT, 'src/data/texts.defaults.json'), 'utf-8'))
const plain = (text) => String(text ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
const faqItems = (site.frontendTexts?.de?.faq?.items ?? defaultTexts.de.faq.items).filter((item) => item.q && item.a)
const visibleBooks = data.books.filter((b) => !b.hidden)
const coverImage = (b) => BASE + '/' + (b.coverFront || b.cover)
// Vorschaubild beim Teilen: JPG-Fassung der Vorderseite (WhatsApp/Facebook zeigen WebP nicht zuverlässig)
const shareImage = (b) => {
  const jpg = (b.coverFront || '').replace(/\.webp$/, '.jpg')
  return jpg && existsSync(join(ROOT, 'public', jpg)) ? `${BASE}/${jpg}` : coverImage(b)
}

function bookJsonLd(b) {
  const rated = typeof b.amazonRating === 'number' && b.amazonRating >= 1 && (b.amazonRatingCount ?? 0) > 0
  return {
    '@type': 'Book',
    name: b.title,
    author: { '@type': 'Person', name: site.authorName },
    publisher: { '@type': 'Organization', name: site.brand },
    inLanguage: b.lang === 'en' ? 'en' : 'de',
    image: coverImage(b),
    url: b.amazon,
    ...(b.description ? { description: plain(b.description) } : {}),
    ...(rated ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: b.amazonRating, ratingCount: b.amazonRatingCount, bestRating: 5, worstRating: 1 } } : {}),
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: site.brand,
      url: BASE + '/',
      inLanguage: ['de', 'en'],
    },
    {
      '@type': 'Organization',
      name: site.brand,
      url: BASE + '/',
      logo: BASE + '/images/lambking-stories-logo-v2-256.webp',
      founder: { '@type': 'Person', name: site.authorName },
      ...(site.contactEmail ? { email: site.contactEmail } : {}),
    },
    ...visibleBooks.map(bookJsonLd),
    ...(faqItems.length
      ? [{
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: plain(item.q), acceptedAnswer: { '@type': 'Answer', text: plain(item.a) } })),
        }]
      : []),
  ],
}

const indexPath = join(DIST, 'index.html')
let html = readFileSync(indexPath, 'utf-8')
const tag = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
if (!html.includes('application/ld+json')) {
  html = html.replace('</head>', `  ${tag}\n  </head>`)
  writeFileSync(indexPath, html, 'utf-8')
}

// ── Eigenständige Creator-&-Partner-Route mit eigenen SEO-Daten ──
if (creatorPartnerEnabled) {
  const creatorTitle = 'Creator- oder Influencer-Partner werden | LambKing Stories'
  const creatorDescription = 'Bewirb dich als Creator- oder Influencer-Partner von LambKing Stories und empfehle biblische Kinderbücher authentisch an deine Community.'
  const creatorCanonical = `${BASE}/creator-partner/`
  const creatorJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: creatorTitle,
    description: creatorDescription,
    url: creatorCanonical,
    isPartOf: { '@type': 'WebSite', name: site.brand, url: `${BASE}/` },
  }
  const creatorHtml = html
    .replace('<head>', '<head>\n    <base href="../" />')
    .replace(/<title>.*?<\/title>/, `<title>${creatorTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, `<meta name="description" content="${creatorDescription}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${creatorCanonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${creatorTitle}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s, `<meta property="og:description" content="${creatorDescription}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${creatorCanonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${creatorTitle}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s, `<meta name="twitter:description" content="${creatorDescription}" />`)
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(creatorJsonLd)}</script>`)
  const creatorDir = join(DIST, 'creator-partner')
  mkdirSync(creatorDir, { recursive: true })
  writeFileSync(join(creatorDir, 'index.html'), creatorHtml, 'utf-8')
}

// ── Eine eigene Seite je sichtbarem Buch (buch/<name>/) ───────────
// Suchmaschinen finden so jedes Buch mit eigenem Titel, eigener Beschreibung, Bild und Strukturdaten. Im Browser startet
// die normale Seite und öffnet das Buchfenster (src/data/bookLink.ts). Der Text im <div id="root"> gilt nur, bis die
// Seite geladen ist (und für Suchmaschinen ohne JavaScript).
const slugs = bookSlugs(visibleBooks)
const bookPageUrl = (b) => `${BASE}/buch/${slugs[b.id]}/`
const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const LANGUAGE_NAMES = { de: 'Deutsch', en: 'English', es: 'Español', ro: 'Română', fr: 'Français' }
const shorten = (text, max) => (text.length <= max ? text : text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…')
const setTag = (source, pattern, replacement) => (pattern.test(source) ? source.replace(pattern, replacement) : source)

function bookPageHtml(b) {
  const { main, sub } = splitTitle(b)
  const en = b.lang === 'en'
  const url = bookPageUrl(b)
  const pageTitle = `${b.title} | ${site.brand}`
  const fallback = en ? `${main}${sub ? ` – ${sub}` : ''}. ${b.detail || ''} ${site.brand}.` : `${main}${sub ? ` – ${sub}` : ''}. ${b.detail || ''} ${site.brand}.`
  const description = shorten(plain(b.description) || plain(fallback), 160)
  const image = shareImage(b)
  const editions = (b.editions ?? []).filter((e) => typeof e.amazon === 'string' && e.amazon.startsWith('https://'))
  const homeUrl = `${BASE}/`
  const jsonLdPage = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...bookJsonLd(b),
        '@id': `${url}#buch`,
        url,
        ...(editions.length
          ? { workExample: editions.map((e) => ({ '@type': 'Book', bookFormat: 'https://schema.org/Paperback', inLanguage: e.language, url: e.amazon })) }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.brand, item: homeUrl },
          { '@type': 'ListItem', position: 2, name: en ? 'Books' : 'Bücher', item: `${homeUrl}#buecher` },
          { '@type': 'ListItem', position: 3, name: main, item: url },
        ],
      },
    ],
  }
  const rated = typeof b.amazonRating === 'number' && b.amazonRating >= 1 && (b.amazonRatingCount ?? 0) > 0
  const highlights = (b.highlights ?? []).map(plain).filter(Boolean)
  const staticBody = `<div id="root"><main style="max-width:760px;margin:0 auto;padding:32px 16px;text-align:center;color:#1c2a4a;font-family:inherit">
      <p><a href="./" style="color:inherit">${esc(site.brand)}</a></p>
      <img src="${esc(b.coverFront || b.cover)}" alt="${esc(b.title)}" width="320" height="414" style="max-width:100%;height:auto;border-radius:6px" />
      <h1>${esc(b.title)}</h1>
      ${b.detail ? `<p>${esc(b.detail)}${b.age ? ` · ${esc(b.age)}` : ''}</p>` : ''}
      <p>${esc(plain(b.description) || description)}</p>
      ${highlights.length ? `<ul style="text-align:left;display:inline-block">${highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      ${rated ? `<p>${esc(String(b.amazonRating).replace('.', en ? '.' : ','))} / 5 · ${b.amazonRatingCount} ${en ? (b.amazonRatingCount === 1 ? 'review on Amazon' : 'reviews on Amazon') : (b.amazonRatingCount === 1 ? 'Bewertung bei Amazon' : 'Bewertungen bei Amazon')}</p>` : ''}
      ${editions.length ? `<p>${en ? 'Buy on Amazon' : 'Bei Amazon kaufen'}: ${editions.map((e) => `<a href="${esc(e.amazon)}" rel="noopener noreferrer">${esc(LANGUAGE_NAMES[e.language] || e.language.toUpperCase())}</a>`).join(' · ')}</p>` : ''}
      <p><a href="./#buecher">${en ? 'All books by' : 'Alle Bücher von'} ${esc(site.brand)}</a></p>
    </main></div>`

  let page = html
    .replace('<head>', '<head>\n    <base href="../../" />')
    .replace(/<html lang="[^"]*"/, `<html lang="${en ? 'en' : 'de'}"`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(pageTitle)}</title>`)
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, () => `<script type="application/ld+json">${JSON.stringify(jsonLdPage)}</script>`)
    .replace('<div id="root"></div>', () => staticBody)
  page = setTag(page, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, () => `<meta name="description" content="${esc(description)}" />`)
  page = setTag(page, /<link rel="canonical" href="[^"]*"\s*\/>/, () => `<link rel="canonical" href="${url}" />`)
  page = setTag(page, /<meta property="og:title" content="[^"]*"\s*\/>/, () => `<meta property="og:title" content="${esc(pageTitle)}" />`)
  page = setTag(page, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s, () => `<meta property="og:description" content="${esc(description)}" />`)
  page = setTag(page, /<meta property="og:url" content="[^"]*"\s*\/>/, () => `<meta property="og:url" content="${url}" />`)
  page = setTag(page, /<meta property="og:type" content="[^"]*"\s*\/>/, () => '<meta property="og:type" content="book" />')
  page = setTag(page, /<meta property="og:image" content="[^"]*"\s*\/>/, () => `<meta property="og:image" content="${esc(image)}" />`)
  page = page
    .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '')
    .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '')
  page = setTag(page, /<meta property="og:image:alt" content="[^"]*"\s*\/>/, () => `<meta property="og:image:alt" content="${esc(b.title)}" />`)
  page = setTag(page, /<meta name="twitter:title" content="[^"]*"\s*\/>/, () => `<meta name="twitter:title" content="${esc(pageTitle)}" />`)
  page = setTag(page, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s, () => `<meta name="twitter:description" content="${esc(description)}" />`)
  page = setTag(page, /<meta name="twitter:image" content="[^"]*"\s*\/>/, () => `<meta name="twitter:image" content="${esc(image)}" />`)
  page = setTag(page, /<meta name="twitter:card" content="[^"]*"\s*\/>/, () => '<meta name="twitter:card" content="summary" />')
  return page
}

for (const b of visibleBooks) {
  const dir = join(DIST, 'buch', slugs[b.id])
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), bookPageHtml(b), 'utf-8')
}

// ── robots.txt & sitemap.xml ──────────────────────────────────
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`, 'utf-8')

const today = new Date().toISOString().slice(0, 10)
const urls = ['', ...visibleBooks.map((b) => `buch/${slugs[b.id]}/`), ...(creatorPartnerEnabled ? ['creator-partner/'] : []), 'impressum.html', 'datenschutz/']
  .map((p) => `  <url><loc>${BASE}/${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf-8',
)

console.log(`postbuild: Creator-Partner ${creatorPartnerEnabled ? 'aktiv' : 'deaktiviert'}, ${visibleBooks.length} Buchseiten, Rechtsseiten, robots.txt, sitemap.xml, JSON-LD ✓`)
