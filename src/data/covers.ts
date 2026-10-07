import type { Book, BookEdition } from './books'

// Welches Bild zeigt das Cover? Bevorzugt die kleine, automatisch erzeugte Vorderseite (WebP, ca. 130 KB);
// sonst das Original-Cover (bei Druck-Umschlägen ist dann nur die rechte Hälfte sichtbar → spread).
export function coverFor(book: Pick<Book, 'cover' | 'coverFront' | 'coverSpread'>, edition?: Pick<BookEdition, 'cover' | 'coverFront' | 'coverSpread'>): { src: string; spread: boolean } {
  if (edition?.coverFront) return { src: edition.coverFront, spread: false }
  if (edition?.cover) return { src: edition.cover, spread: Boolean(edition.coverSpread) }
  if (book.coverFront) return { src: book.coverFront, spread: false }
  return { src: book.cover, spread: Boolean(book.coverSpread) }
}
