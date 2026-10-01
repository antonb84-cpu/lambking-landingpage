import { BOOKS, isNew } from './books'

// Buch für die 3D-Vorschau: im Admin gewählt (showInHero), sonst das neueste, sonst das erste.
export function pickFeatured(lang: string) {
  const langBooks = BOOKS.filter((b) => b.lang === lang)
  const pool = langBooks.length > 0 ? langBooks : BOOKS
  return pool.find((book) => book.showInHero) ?? pool.find(isNew) ?? pool[0]
}
