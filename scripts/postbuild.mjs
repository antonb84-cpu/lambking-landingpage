// Post-Build: erzeugt aus den echten Projektdaten (src/data/books.json)
//  - JSON-LD Structured Data in dist/index.html (nur reale Daten)
//  - robots.txt / sitemap.xml
// (impressum.html/datenschutz.html erzeugt scripts/gen-legal.mjs vor dev/build)
// Läuft automatisch am Ende von "npm run build" – lokal und in GitHub Actions.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const site = data.site
const BASE = (site.publicUrl || '').replace(/\/$/, '')
const creatorPartnerEnabled = site.creatorPartnerEnabled !== false

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

// ── robots.txt & sitemap.xml ──────────────────────────────────
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`, 'utf-8')

const today = new Date().toISOString().slice(0, 10)
const urls = ['', ...(creatorPartnerEnabled ? ['creator-partner/'] : []), 'impressum.html', 'datenschutz/']
  .map((p) => `  <url><loc>${BASE}/${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf-8',
)

console.log(`postbuild: Creator-Partner ${creatorPartnerEnabled ? 'aktiv' : 'deaktiviert'}, Rechtsseiten, robots.txt, sitemap.xml, JSON-LD ✓`)
