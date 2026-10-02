import { BOOKS, isNew } from './books'
import { hasFlipbook } from './flipbooks'

// Buch für „Blick ins Buch": im Admin gewählt (showInHero), sonst das neueste mit vollständigem
// Blätterbuch, sonst das neueste, sonst das erste. Ausgeblendete Bücher sind in BOOKS nicht enthalten.
// Die Sprache wählt die Seite im Buch selbst (Flaggen), nicht die Buchauswahl.
export function pickFeatured() {
  return (
    BOOKS.find((book) => book.showInHero)
    ?? BOOKS.find((book) => hasFlipbook(book.id))
    ?? BOOKS.find(isNew)
    ?? BOOKS[0]
  )
}
