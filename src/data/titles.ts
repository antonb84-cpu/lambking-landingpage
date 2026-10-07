import type { Book } from './books'
export { splitTitle } from './bookSlug.mjs'

// „Bibelgeschichten zum Ausmalen · Band 1" -> „Band 1" (die Reihe steht schon in der Überschrift des Abschnitts)
export function volumeLabel(book: Book): string {
  const parts = (book.series ?? '').split('·')
  return parts.length > 1 ? parts.slice(1).join('·').trim() : ''
}

