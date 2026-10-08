import flipbooks from './flipbooks.json'

// Eintrag je Buch und Sprache (flipbooks.json): Ordner der Seitenbilder, wie viele Seiten zur Vorschau gehören (count),
// wie viele Seiten das ganze Buch hat (total), Dateiendung der Seitenbilder (ext, Standard jpg) und die Rückseite.
type Entry = { dir: string; count: number; back?: string; total?: number; ext?: string; ratio?: number }

const entryFor = (bookId: string, lang: string): Entry | undefined =>
  (flipbooks as unknown as Record<string, Record<string, Entry> | undefined>)[bookId]?.[lang]

// Die Vorschauseiten eines Buches (für das durchblätterbare Vorschaubuch) – oder null,
// wenn für dieses Buch/diese Sprache noch kein Blätterbuch vorliegt.
export function flipPagesFor(bookId: string, lang: string): string[] | null {
  const entry = entryFor(bookId, lang)
  if (!entry || !entry.count) return null
  const ext = entry.ext || 'jpg'
  return Array.from({ length: entry.count }, (_, i) => `${entry.dir}/p${String(i + 1).padStart(2, '0')}.${ext}`)
}

// Seitenzahl des ganzen Buches (größer als die Zahl der Vorschauseiten, wenn nur ein Teil gezeigt wird)
export function flipTotalFor(bookId: string, lang: string): number | null {
  const entry = entryFor(bookId, lang)
  if (!entry || !entry.count) return null
  return Math.max(entry.total || 0, entry.count)
}

// Seitenverhältnis (Breite / Höhe) einer Buchseite: Malbuch hochformatig, Bilderbuch quadratisch
export function flipRatioFor(bookId: string, lang: string): number {
  const ratio = entryFor(bookId, lang)?.ratio
  return ratio && ratio > 0.4 && ratio < 2 ? ratio : 621 / 810
}

// Rückseite des Buches (Bild), falls vorhanden – wird als letztes Blatt gezeigt.
export function flipBackFor(bookId: string, lang: string): string | undefined {
  return entryFor(bookId, lang)?.back
}

// Sprachen, in denen für dieses Buch ein Blätterbuch vorliegt (Reihenfolge wie in flipbooks.json).
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
