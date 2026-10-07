import { BOOKS, type Book } from './books'
import { bookSlugs } from './bookSlug.mjs'

// Jedes Buch hat eine eigene, für Suchmaschinen lesbare Seite unter buch/<name>/ (erzeugt scripts/postbuild.mjs).
const SLUGS = bookSlugs(BOOKS)
const BOOK_PATH_RE = /\/buch\/([a-z0-9-]+)\/?$/

/** Relative Adresse der Buchseite (ohne führenden Schrägstrich, funktioniert auf der Startseite und den Buchseiten). */
export function bookPath(book: Book): string {
  return `buch/${SLUGS[book.id]}/`
}

export function isBookPath(pathname = typeof window === 'undefined' ? '' : window.location.pathname): boolean {
  return BOOK_PATH_RE.test(pathname)
}

/** Buch, das die Adresse verlangt: ?buch=<id> oder die Buchseite /buch/<name>/. */
export function bookIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  const byParam = BOOKS.find((book) => book.id === new URLSearchParams(window.location.search).get('buch'))
  if (byParam) return byParam.id
  const slug = window.location.pathname.match(BOOK_PATH_RE)?.[1]
  return slug ? (BOOKS.find((book) => SLUGS[book.id] === slug)?.id ?? null) : null
}
