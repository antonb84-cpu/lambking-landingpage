import { Star } from 'lucide-react'
import { SITE, type Book } from '@/data/books'
import { useLang } from '@/data/lang'

export default function AmazonRating({ book }: { book: Book }) {
  const lang = useLang()
  const rating = book.amazonRating

  if (!SITE.showRatings || !rating || rating < 1 || rating > 5) return null

  const formatted = rating.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const count = book.amazonRatingCount
  const countText = count
    ? ` · ${count.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')} ${lang === 'de' ? 'Bewertungen' : 'ratings'}`
    : ''
  const label = lang === 'de'
    ? `${formatted} von 5 Sternen bei Amazon${countText}`
    : `${formatted} out of 5 stars on Amazon${countText}`

  return (
    <a
      href={book.amazon}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="mt-3 inline-flex w-fit flex-wrap items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/45 hover:text-foreground"
    >
      <span className="flex items-center gap-0.5 text-accent" aria-hidden>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star key={value} className="h-3.5 w-3.5" fill={value <= Math.round(rating) ? 'currentColor' : 'none'} />
        ))}
      </span>
      <span>{formatted}/5 · Amazon{count ? ` (${count.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')})` : ''}</span>
    </a>
  )
}
