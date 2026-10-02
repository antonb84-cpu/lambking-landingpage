import flipbooks from './flipbooks.json'

type Entry = { dir: string; count: number; back?: string }

// Alle Seiten eines Buches (für das durchblätterbare Vorschaubuch) – oder null,
// wenn für dieses Buch/diese Sprache noch kein vollständiges Blätterbuch vorliegt.
export function flipPagesFor(bookId: string, lang: string): string[] | null {
  const entry = (flipbooks as unknown as Record<string, Record<string, Entry> | undefined>)[bookId]?.[lang]
  if (!entry || !entry.count) return null
  return Array.from({ length: entry.count }, (_, i) => `${entry.dir}/p${String(i + 1).padStart(2, '0')}.jpg`)
}

// Rückseite des Buches (Bild), falls vorhanden – wird als letztes Blatt gezeigt.
export function flipBackFor(bookId: string, lang: string): string | undefined {
  const entry = (flipbooks as unknown as Record<string, Record<string, Entry> | undefined>)[bookId]?.[lang]
  return entry?.back
}

// Sprachen, in denen für dieses Buch ein vollständiges Blätterbuch vorliegt (Reihenfolge wie in flipbooks.json).
export function flipLanguagesFor(bookId: string): string[] {
  const langs = (flipbooks as unknown as Record<string, Record<string, Entry> | undefined>)[bookId]
  if (!langs) return []
  return Object.entries(langs)
    .filter(([, entry]) => entry && entry.count > 0)
    .map(([code]) => code)
}

// true, wenn für das Buch irgendeine Sprache als Blätterbuch vorliegt
export function hasFlipbook(bookId: string): boolean {
  return flipLanguagesFor(bookId).length > 0
}
