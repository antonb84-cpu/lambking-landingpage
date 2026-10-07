import type { Book } from './books'

// Sprach-Ausgaben eines Buches (mit Amazon-Link je Sprache); ohne Ausgaben gilt die Hauptsprache des Buches.
export const editionsOf = (book: Book) => book.editions?.length
  ? book.editions.filter((edition) => edition.language)
  : (book.amazon.startsWith('https://') ? [{ language: book.lang, amazon: book.amazon }] : [])
