import { useState } from 'react'
import { BookOpen, ChevronRight, PackageCheck, Truck } from 'lucide-react'
import AmazonRating from '@/components/AmazonRating'
import BuyButton from '@/components/BuyButton'
import ProductCard from '@/components/ProductCard'
import RichText from '@/components/RichText'
import { Badge } from '@/components/ui/badge'
import { BookMediaGallery, BulkDiscountDialog, LanguageEditions, Lightbox } from '@/sections/Books'
import { BOOKS, type Book } from '@/data/books'
import { booksCopyForEdition, catLabelOf, highlightIcon, isColoringBook, localizedBook, typeLabelOf } from '@/data/bookView'
import { editionsOf } from '@/data/editions'
import { hasFlipbook } from '@/data/flipbooks'
import { useLang } from '@/data/lang'
import { openFlipBookById } from '@/data/openBook'
import { shopHref, shopTexts, siteRoot } from '@/data/shop'
import { textsFor } from '@/data/texts'
import { splitTitle } from '@/data/titles'

const seriesName = (b: Book) => (b.series ?? '').split('·')[0].trim()
const closeness = (b: Book, to: Book) => (seriesName(b) && seriesName(b) === seriesName(to) ? 2 : 0) + (b.category === to.category ? 1 : 0)

// Eigene Produktseite je Buch (buch/<name>/): Bilder links, rechts Titel, Bewertung, Ausgaben und der Kaufkasten,
// darunter Beschreibung, Eckdaten, Blick ins Buch und passende weitere Bücher.
export default function ProductPage({ book }: { book: Book }) {
  const lang = useLang()
  const s = shopTexts(lang)
  const siteCopy = textsFor(lang).books
  const editions = editionsOf(book)
  const [editionLanguage, setEditionLanguage] = useState<string | null>(
    () => editions.find((item) => item.language === lang)?.language
      ?? editions.find((item) => item.language === book.lang)?.language
      ?? editions[0]?.language
      ?? null,
  )
  const [zoom, setZoom] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const edition = editions.find((item) => item.language === editionLanguage)
  const shown = edition ? localizedBook(book, edition.language) : book
  const copy = booksCopyForEdition(lang, editionLanguage)
  const { main, sub } = splitTitle(shown)
  const canBuy = !book.comingSoon && !!edition?.amazon.startsWith('https://')
  const typeLabel = editionLanguage === 'es' && isColoringBook(book)
    ? 'Libro para colorear'
    : editionLanguage === 'ro' && isColoringBook(book)
      ? 'Carte de colorat'
      : typeLabelOf(book, editionLanguage === 'en' ? 'en' : 'de')
  const related = BOOKS
    .filter((b) => b.id !== book.id && (b.lang === lang || editionsOf(b).some((item) => item.language === lang)))
    // erst dieselbe Reihe, dann dieselbe Buchart
    .sort((a, b) => closeness(b, book) - closeness(a, book))
    .slice(0, 4)

  return (
    <main id="inhalt" className={canBuy ? 'pb-24 md:pb-0' : ''}>
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6 lg:pb-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-muted-foreground">
          <a href={siteRoot()} className="hover:text-foreground hover:underline">{s.home}</a>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <a href={shopHref()} className="hover:text-foreground hover:underline">{s.allBooks}</a>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <a href={shopHref({ category: book.category })} className="hover:text-foreground hover:underline">{catLabelOf(book.category, lang)}</a>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="text-foreground" aria-current="page">{main}</span>
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-12" lang={editionLanguage ?? lang}>
          <BookMediaGallery key={`${book.id}:${editionLanguage ?? lang}`} book={shown} onZoom={setZoom} copy={copy} page />

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">{typeLabel}</Badge>
              {shown.age ? <Badge variant="secondary" className="rounded-full">{shown.age}</Badge> : null}
              {book.comingSoon ? <Badge className="rounded-full bg-primary text-primary-foreground">{copy.comingSoonBadge}</Badge> : null}
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{main}</h1>
            {sub ? <p className="mt-1 text-lg text-muted-foreground">{sub}</p> : null}
            {shown.series ? <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{shown.series}</p> : null}
            {shown.detail ? <p className="mt-2 text-sm font-semibold text-foreground/80">{shown.detail}</p> : null}
            <AmazonRating book={shown} />

            {editions.length > 0 ? <LanguageEditions book={book} left label={s.editionLabel} onSelect={setEditionLanguage} /> : null}

            <div className="mt-6 max-w-md rounded-2xl border border-[#e1d5b8] bg-[#fffdf8] p-5 shadow-[0_18px_30px_-24px_rgba(21,49,103,0.55)]">
              {book.comingSoon ? (
                <p className="text-sm font-semibold text-foreground">{copy.comingSoonText}</p>
              ) : canBuy ? (
                <>
                  <p className="text-sm font-semibold text-muted-foreground">{copy.seePrice}</p>
                  <div className="mt-3 grid justify-items-start gap-3">
                    <BuyButton book={shown} size="lg" preferredLanguage={editionLanguage || undefined} label={copy.buyAmazon} />
                    <button
                      type="button"
                      onClick={() => setBulkOpen(true)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
                    >
                      <PackageCheck className="h-5 w-5" aria-hidden />
                      {siteCopy.bulkDiscountButton}
                    </button>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Truck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {s.soldVia}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">{copy.amazonPending}</p>
              )}
              {hasFlipbook(book.id) ? (
                <button
                  type="button"
                  onClick={() => openFlipBookById(book.id)}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
                >
                  <BookOpen className="h-5 w-5" aria-hidden />
                  {siteCopy.flipInside}
                </button>
              ) : null}
            </div>

            <h2 className="mt-9 font-display text-xl font-semibold">{s.description}</h2>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              <RichText text={shown.description || ''} />
            </p>

            {shown.highlights.length > 0 ? (
              <>
                <h2 className="mt-8 font-display text-xl font-semibold">{copy.bookInfoTitle}</h2>
                <ul className="mt-3 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {shown.highlights.map((highlight) => {
                    const Icon = highlightIcon(highlight)
                    return (
                      <li key={highlight} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-semibold leading-snug shadow-sm">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <RichText text={highlight} />
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : null}
          </div>
        </div>

        {shown.samples.length > 0 ? (
          <section className="mt-12" aria-label={s.insideTitle}>
            <h2 className="font-display text-2xl font-semibold">{s.insideTitle}</h2>
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-3">
              {shown.samples.map((src, index) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setZoom(src)}
                    aria-label={`${copy.samplePage} ${index + 1} – ${copy.zoom}`}
                    className="block overflow-hidden rounded-lg border border-[#e6dcc3] bg-white shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
                  >
                    <img src={src} alt="" loading="lazy" className="h-44 w-auto sm:h-56" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-12" aria-label={s.related}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">{s.related}</h2>
              <a href={shopHref()} className="text-sm font-bold text-primary underline-offset-4 hover:underline">{s.backToBooks}</a>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {related.map((b) => (
                <li key={b.id}><ProductCard book={b} /></li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Handy: Kaufknopf bleibt am unteren Rand sichtbar */}
      {canBuy ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-2.5 shadow-[0_-8px_20px_-16px_rgba(30,42,74,0.45)] backdrop-blur md:hidden">
          <p className="min-w-0 truncate text-sm font-bold">{main}</p>
          <div className="w-[190px] shrink-0"><BuyButton book={shown} preferredLanguage={editionLanguage || undefined} label={copy.buyAmazon} /></div>
        </div>
      ) : null}

      <Lightbox
        src={zoom}
        sources={shown.samples}
        onClose={() => setZoom(null)}
        onNavigate={setZoom}
        label={copy.backToBook}
        previousLabel={copy.previousPage}
        nextLabel={copy.nextPage}
        pageLabel={copy.page}
        imageAlt={`${shown.title} – ${copy.enlargedSamplePage}`}
      />
      <BulkDiscountDialog open={bulkOpen} onOpenChange={setBulkOpen} bookTitle={shown.title} />
    </main>
  )
}
