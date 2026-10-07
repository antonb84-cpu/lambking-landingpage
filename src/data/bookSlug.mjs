// Titel-Zerlegung und Web-Pfad je Buch. Eine Quelle für Browser (src) und Build (scripts/postbuild.mjs).

// Kartentitel: „Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt"
// wird zu Haupttitel „Die Schöpfung" und Untertitel „Gott macht die Welt"; die Reihe steht darüber.
export function splitTitle(book) {
  let title = book.title
  const series = (book.series ?? '').split('·')[0].trim()
  if (series && title.toLowerCase().startsWith(series.toLowerCase())) {
    title = title.slice(series.length).replace(/^[\s:–-]+/, '')
  }
  title = title.replace(/^(Band|Volume|Vol\.|Tomo|Volumen)\s*\d+\s*[-–:]\s*/i, '')
  const parts = title.split(/\s[–-]\s/)
  if (parts.length > 1) return { main: parts[0].trim(), sub: parts.slice(1).join(' – ').trim() }
  return { main: title.trim() }
}

const UMLAUTS = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', é: 'e', è: 'e', á: 'a', à: 'a', í: 'i', ó: 'o', ú: 'u', ñ: 'n', ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't' }

export function slugify(text) {
  const slug = String(text ?? '')
    .toLowerCase()
    .replace(/[äöüßéèáàíóúñăâîșşțţ]/g, (c) => UMLAUTS[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length <= 70) return slug
  const cut = slug.slice(0, 70)
  return cut.slice(0, cut.lastIndexOf('-') > 20 ? cut.lastIndexOf('-') : 70)
}

// Sprechender Pfad je Buch („david-und-goliath-mutig-mit-gott"); bei doppelten Namen hängt die Buch-ID an.
export function bookSlugs(books) {
  const result = {}
  const used = new Set()
  for (const book of books) {
    const { main, sub } = splitTitle(book)
    let slug = slugify(sub ? `${main} ${sub}` : main) || slugify(book.id) || 'buch'
    if (used.has(slug)) slug = `${slug}-${slugify(book.id)}`
    used.add(slug)
    result[book.id] = slug
  }
  return result
}
