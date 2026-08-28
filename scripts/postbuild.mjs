// Post-Build: erzeugt aus den echten Projektdaten (src/data/books.json)
//  - impressum.html / datenschutz.html (direkt aufrufbare Rechtsseiten)
//  - JSON-LD Structured Data in dist/index.html (nur reale Daten)
//  - robots.txt / sitemap.xml
// Läuft automatisch am Ende von "npm run build" – lokal und in GitHub Actions.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const site = data.site
const BASE = (site.publicUrl || '').replace(/\/$/, '')

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── Rechtsseiten ──────────────────────────────────────────────
function legalHtml(title, text) {
  const blocks = String(text)
    .split(/\n\s*\n/)
    .map((b) => {
      const lines = b.split('\n')
      const [first, ...rest] = lines
      const isHeading = rest.length > 0 && first.length < 70 && !first.endsWith('.')
      if (isHeading) {
        return `<h2>${esc(first)}</h2><p>${esc(rest.join('\n')).replace(/\n/g, '<br>')}</p>`
      }
      return `<p>${esc(b).replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} – LambKing Stories</title>
<meta name="description" content="${esc(title)} von LambKing Stories.">
<link rel="icon" type="image/png" href="images/app-logo.png">
<style>
  @font-face { font-family: 'Fraunces'; font-weight: 400 700; font-display: swap;
    src: url('fonts/Fraunces-var-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Quicksand'; font-weight: 300 700; font-display: swap;
    src: url('fonts/Quicksand-var-latin.woff2') format('woff2'); }
  body { font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif; background: #FBF7EF;
    color: #1B2A4A; margin: 0; }
  header { background: #1F3461; padding: 18px 24px; display: flex; align-items: center; gap: 14px; }
  header img { height: 44px; }
  header a { color: #fff; text-decoration: none; font-weight: 700; margin-left: auto; }
  main { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-family: 'Fraunces', Georgia, serif; font-size: 34px; margin: 0 0 24px; }
  h2 { font-family: 'Fraunces', Georgia, serif; font-size: 20px; margin: 28px 0 6px; }
  p { line-height: 1.7; color: #45506B; margin: 0 0 14px; }
</style>
</head>
<body>
<header>
  <a href="index.html"><img src="images/logo.webp" alt="LambKing Stories"></a>
  <a href="index.html">← Zurück zur Startseite</a>
</header>
<main>
  <h1>${esc(title)}</h1>
  ${blocks}
</main>
</body>
</html>
`
}

writeFileSync(join(DIST, 'impressum.html'), legalHtml('Impressum', site.impressum), 'utf-8')
writeFileSync(join(DIST, 'datenschutz.html'), legalHtml('Datenschutzerklärung', site.datenschutz), 'utf-8')

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
