import { Star } from 'lucide-react'
import BuyButton from '@/components/BuyButton'
import { BookCover } from '@/sections/Books'
import { SITE, isNew, type Book } from '@/data/books'
import { bookPath } from '@/data/bookLink'
import { localizedBook, typeLabelOf } from '@/data/bookView'
import { coverFor } from '@/data/covers'
import { editionsOf } from '@/data/editions'
import { useLang } from '@/data/lang'
import { LANGUAGE_META } from '@/data/languageMeta'
import { shopTexts } from '@/data/shop'
import { textsFor } from '@/data/texts'
import { splitTitle, volumeLabel } from '@/data/titles'

// Produktkarte im Shop-Raster: Cover oben, darunter Art, Titel, Alter, Bewertung, Sprachen und der Weg zu Amazon.
// Die ganze Karte führt auf die eigene Buchseite (buch/<name>/).
export default function ProductCard({ book }: { book: Book }) {
  const lang = useLang()
  const t = textsFor(lang).books
  const s = shopTexts(lang)
  const cardBook = localizedBook(book, lang)
  const { main, sub } = splitTitle(cardBook)
  const cover = coverFor(cardBook)
  const href = bookPath(book)
  const volume = volumeLabel(cardBook)
  const editions = editionsOf(book)
  const hasAmazonLink = editions.some((edition) => edition.amazon.startsWith('https://'))
  const rating = book.amazonRating
  const hasRating = SITE.showRatings && !!rating && rating >= 1 && rating <= 5
  const locale = lang === 'de' ? 'de-DE' : 'en-US'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e6dcc3] bg-white shadow-[0_14px_26px_-20px_rgba(21,49,103,0.5)] transition-shadow hover:shadow-[0_22px_34px_-18px_rgba(21,49,103,0.55)]">
      {/* Das Cover öffnet die Buchseite per Klick, ist aber bewusst kein Link: sonst blendet der Browser beim Überfliegen
          unten links ständig die Adresse ein und aus. Der Titel darunter bleibt der echte Link (Tastatur, Suchmaschinen). */}
      <div
        onClick={() => window.location.assign(href)}
        className="relative flex aspect-[4/5] cursor-pointer items-center justify-center bg-[radial-gradient(120%_90%_at_50%_0%,#fff,#efe6d0)] p-4 sm:p-6"
      >
        {book.comingSoon ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold leading-none text-primary-foreground shadow sm:text-xs">{t.comingSoonBadge}</span>
        ) : isNew(book) ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold leading-none text-accent-foreground shadow sm:text-xs">{t.newBadge}</span>
        ) : null}
        {cover.spread ? (
          <span className="block h-full"><BookCover book={cardBook} variant="card" /></span>
        ) : (
          <img
            src={cover.src}
            alt=""
            loading="lazy"
            draggable={false}
            className="max-h-full w-auto max-w-full rounded-[3px] shadow-[0_1px_2px_rgba(21,30,60,0.4),0_10px_14px_-6px_rgba(40,25,10,0.55),0_22px_24px_-12px_rgba(40,25,10,0.45)] transition-transform duration-300 group-hover:-translate-y-1.5"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent sm:text-[11px]">
          {typeLabelOf(book, lang)}{volume ? ` · ${volume}` : ''}
        </p>
        <h3 className="mt-1 hyphens-auto break-words font-display text-[0.8rem] font-semibold leading-tight min-[420px]:text-[0.95rem] sm:text-base">
          <a href={href} className="hover:underline">{main}</a>
        </h3>
        {sub ? <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground sm:text-sm">{sub}</p> : null}
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground sm:text-xs">
          {cardBook.age}{cardBook.detail ? ` · ${cardBook.detail}` : ''}
        </p>
        <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1.5">
          {hasRating ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground" aria-label={`${rating.toLocaleString(locale, { minimumFractionDigits: 1 })} ${t.ratingOf} – Amazon`}>
              <span className="flex items-center gap-0.5 text-accent" aria-hidden>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className="h-3.5 w-3.5" fill={value <= Math.round(rating) ? 'currentColor' : 'none'} />
                ))}
              </span>
              <span aria-hidden>
                {rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                {book.amazonRatingCount ? ` (${book.amazonRatingCount.toLocaleString(locale)})` : ''}
              </span>
            </span>
          ) : null}
          {editions.length > 1 ? (
            <span className="flex items-center gap-1" aria-label={`${t.availableLanguages}: ${editions.map((edition) => LANGUAGE_META[edition.language]?.[lang] ?? edition.language.toUpperCase()).join(', ')}`}>
              {editions.map((edition) => {
                const meta = LANGUAGE_META[edition.language]
                return meta
                  ? <img key={edition.language} src={meta.flag} alt="" aria-hidden className="h-4 w-4 rounded-full object-cover shadow-sm" />
                  : <span key={edition.language} className="text-[10px] font-bold text-muted-foreground" aria-hidden>{edition.language.toUpperCase()}</span>
              })}
            </span>
          ) : null}
        </div>
        <div className="mt-auto grid justify-items-center gap-2 pt-3">
          {hasAmazonLink && !book.comingSoon ? <BuyButton book={cardBook} /> : null}
          <a href={href} className="inline-flex min-h-9 items-center text-sm font-bold text-primary underline-offset-4 hover:underline">
            {s.details}
          </a>
        </div>
      </div>
    </article>
  )
}
