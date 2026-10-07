import type { Book } from './books'

// Kartentitel: „Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt"
// wird zu Haupttitel „Die Schöpfung" und Untertitel „Gott macht die Welt"; die Reihe steht darüber.
export function splitTitle(book: Book): { main: string; sub?: string } {
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

// „Bibelgeschichten zum Ausmalen · Band 1" -> „Band 1" (die Reihe steht schon in der Überschrift des Abschnitts)
export function volumeLabel(book: Book): string {
  const parts = (book.series ?? '').split('·')
  return parts.length > 1 ? parts.slice(1).join('·').trim() : ''
}

