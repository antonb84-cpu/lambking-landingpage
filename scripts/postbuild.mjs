// Post-Build: erzeugt aus den echten Projektdaten (src/data/books.json)
//  - JSON-LD Structured Data in dist/index.html (nur reale Daten)
//  - robots.txt / sitemap.xml
// (impressum.html/datenschutz.html erzeugt scripts/gen-legal.mjs vor dev/build)
// Läuft automatisch am Ende von "npm run build" – lokal und in GitHub Actions.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const site = data.site
const BASE = (site.publicUrl || '').replace(/\/$/, '')

// ── JSON-LD Structured Data (nur reale Daten) ─────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: site.brand,
      url: BASE + '/',
      inLanguage: ['de', 'en'],
    },
    ...data.books.map((b) => ({
      '@type': 'Book',
      name: b.title,
      author: { '@type': 'Person', name: site.authorName },
      inLanguage: b.lang === 'en' ? 'en' : 'de',
      image: BASE + '/' + b.cover,
      url: b.amazon,
      ...(b.description ? { description: b.description } : {}),
    })),
  ],
}

const indexPath = join(DIST, 'index.html')
let html = readFileSync(indexPath, 'utf-8')
const tag = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
if (!html.includes('application/ld+json')) {
  html = html.replace('</head>', `  ${tag}\n  </head>`)
  writeFileSync(indexPath, html, 'utf-8')
}

// ── robots.txt & sitemap.xml ──────────────────────────────────
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`, 'utf-8')

const today = new Date().toISOString().slice(0, 10)
const urls = ['', 'impressum.html', 'datenschutz.html']
  .map((p) => `  <url><loc>${BASE}/${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf-8',
)

console.log('postbuild: impressum.html, datenschutz.html, robots.txt, sitemap.xml, JSON-LD ✓')
