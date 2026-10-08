import { Star } from 'lucide-react'
import { isMiddleClick, trackAmazonClick } from '@/data/analytics'
import { SITE, type Book } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Link zum „Bewertung schreiben"-Formular des Buches bei Amazon (gleicher Shop wie der Kauf-Link).
function reviewUrl(amazon: string): string {
  const match = amazon.match(/^(https:\/\/[^/]+)\/(?:[^/]+\/)?dp\/([A-Z0-9]{10})/)
  return match ? `${match[1]}/review/create-review?asin=${match[2]}` : amazon
}

// Sterne (1–5) unter jedem Buch. Mit Amazon-Bewertung: echte Sterne. Ohne: leere Sterne und
// eine Einladung, bei Amazon zu bewerten – es werden nie Bewertungen erfunden.
export default function AmazonRating({ book }: { book: Book }) {
  const lang = useLang()
  const t = textsFor(lang).books
  const rating = book.amazonRating
  if (!SITE.showRatings || !book.amazon.startsWith('https://')) return null

  const hasRating = !!rating && rating >= 1 && rating <= 5
  const locale = lang === 'de' ? 'de-DE' : 'en-US'
  const count = book.amazonRatingCount
  const formatted = hasRating
    ? rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : ''
  const label = hasRating
    ? `${formatted} ${t.ratingOf}${count ? ` (${count.toLocaleString(locale)})` : ''} – Amazon`
    : `${t.ratingNone} – ${t.ratingCta}`

  return (
    <a
      href={hasRating ? book.amazon : reviewUrl(book.amazon)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={() => hasRating && trackAmazonClick(book.id, book.lang)}
      onAuxClick={(event) => hasRating && isMiddleClick(event) && trackAmazonClick(book.id, book.lang)}
      className="mt-3 flex h-16 w-full max-w-[220px] flex-col items-center justify-center gap-y-1 rounded-2xl border border-accent/25 bg-accent/5 px-3 text-[11px] font-semibold leading-tight text-muted-foreground transition-colors hover:border-accent/45 hover:text-foreground sm:text-xs"
    >
      <span className="flex shrink-0 items-center gap-0.5 text-accent" aria-hidden>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star key={value} className="h-4 w-4" fill={hasRating && value <= Math.round(rating) ? 'currentColor' : 'none'} />
        ))}
      </span>
      <span className="text-center">
        {hasRating ? `${formatted}/5${count ? ` (${count.toLocaleString(locale)})` : ''} · Amazon` : t.ratingCta}
      </span>
    </a>
  )
}
