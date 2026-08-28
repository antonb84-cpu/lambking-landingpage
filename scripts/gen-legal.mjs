// Erzeugt public/impressum.html + public/datenschutz.html aus books.json.
// Läuft automatisch vor dev UND build (predev/prebuild) – dadurch
// funktionieren die Rechtsseiten in der lokalen Vorschau UND live.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf-8'))
const site = data.site

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function legalHtml(title, text) {
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

writeFileSync(join(ROOT, 'public', 'impressum.html'), legalHtml('Impressum', site.impressum), 'utf-8')
writeFileSync(join(ROOT, 'public', 'datenschutz.html'), legalHtml('Datenschutzerklärung', site.datenschutz), 'utf-8')
console.log('gen-legal: impressum.html + datenschutz.html ✓')
