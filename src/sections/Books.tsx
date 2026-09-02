import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, ArrowRight, Eye, Palette, X, ZoomIn } from 'lucide-react'
import Reveal from '@/components/Reveal'
import AmazonRating from '@/components/AmazonRating'
import { BOOKS, CATEGORIES, COMING_SOON, isNew, type Book, type Category } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { OPEN_BOOK_EVENT } from '@/data/openBook'

// Kategorie-Helfer (Labels/Typen kommen aus den Buchdaten, sprachabhängig)
const catDefOf = (id: string) => CATEGORIES.find((c) => c.id === id)
const typeLabelOf = (b: Book, lang: 'de' | 'en'): string => {
  const c = catDefOf(b.category)
  return c ? (lang === 'en' ? c.typeEn : c.typeDe) : b.category
}
const catLabelOf = (id: string, lang: 'de' | 'en'): string => {
  const c = catDefOf(id)
  return c ? (lang === 'en' ? c.labelEn : c.labelDe) : id
}

function BuyButton({ book, size = 'md' }: { book: Book; size?: 'md' | 'lg' }) {
  const t = textsFor(useLang())
  const width = size === 'lg' ? 'max-w-[305px]' : 'max-w-[240px]'
  // Kein gültiger Amazon-Link → kein kaputter Button
  if (!book.amazon.startsWith('https://')) return null
  return (
    <a
      href={book.amazon}
      target="_blank"
      rel="noopener noreferrer"
      className={`mx-auto block w-full ${width} transition-transform hover:scale-[1.05]`}
      aria-label={`${book.title} – ${t.books.buyAmazon}`}
    >
      <img src="images/buttons/amazon.png" alt={t.books.buyAmazon} className="h-auto w-full" />
    </a>
  )
}

function BookDialog({
  book,
  onClose,
  onZoom,
  zoom,
  onZoomClose,
}: {
  book: Book | null
  onClose: () => void
  onZoom: (src: string) => void
  zoom: string | null
  onZoomClose: () => void
}) {
  const t = textsFor(useLang())
  const lang = useLang()
  const zoomOpen = !!zoom
  return (
    <Dialog open={!!book} onOpenChange={(open) => !open && !zoomOpen && onClose()}>
      <DialogContent
        className="max-h-[92vh] w-[94vw] max-w-5xl overflow-y-auto rounded-md border-2 bg-background p-0"
        closeButtonClassName="right-3 top-3 flex size-12 items-center justify-center rounded-full border border-primary/15 bg-white opacity-100 shadow-lg sm:right-4 sm:top-4 sm:size-10"
        closeButtonIconClassName="size-7 sm:size-5"
        onEscapeKeyDown={(e) => zoomOpen && e.preventDefault()}
        onPointerDownOutside={(e) => zoomOpen && e.preventDefault()}
      >
        {book && (
          <div className="grid lg:grid-cols-[380px_1fr]">
            <div className="bg-secondary/60 p-8 lg:p-10">
              <img
                src={book.cover}
                alt={book.title}
                className="mx-auto w-full max-w-[320px] rounded-md shadow-2xl shadow-primary/25 lg:sticky lg:top-10"
              />
            </div>
            <div className="p-8 lg:p-12">
              <DialogHeader>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{typeLabelOf(book, lang)}</Badge>
                  {book.age && <Badge variant="secondary" className="rounded-full">{book.age}</Badge>}
                  {book.detail && <Badge variant="secondary" className="rounded-full">{book.detail}</Badge>}
                </div>
                <DialogTitle className="font-display text-3xl font-semibold leading-tight lg:text-4xl">
                  {book.title}
                </DialogTitle>
                {book.series && (
                  <p className="pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {book.series}
                  </p>
                )}
              </DialogHeader>
              <DialogDescription className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-loose text-muted-foreground">
                {book.description}
              </DialogDescription>
              <ul className="mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2">
                {book.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              <AmazonRating book={book} />
              {book.samples.length > 0 && (
                <>
                  <p className="mb-3 mt-9 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t.books.samplesHint}
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {book.samples.map((s, index) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onZoom(s)}
                        className="group relative block rounded-md border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
                      >
                        <img
                          src={s}
                          alt={`${book.title} – Vorschauseite ${index + 1}`}
                          className="w-full rounded-md"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                          {t.books.zoom}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="sticky bottom-0 z-10 -mx-8 mt-9 flex flex-wrap items-center justify-between gap-4 border-t-2 border-border bg-background/95 px-8 py-5 shadow-[0_-8px_20px_-16px_rgba(30,42,74,0.35)] backdrop-blur lg:-mx-12 lg:px-12">
                <p className="font-semibold text-muted-foreground">{t.books.seePrice}</p>
                <BuyButton book={book} size="lg" />
              </div>
            </div>
          </div>
        )}
        <Lightbox
          src={zoom}
          sources={book?.samples ?? []}
          onClose={onZoomClose}
          onNavigate={onZoom}
          label={t.books.backToBook}
          previousLabel={t.books.previousPage}
          nextLabel={t.books.nextPage}
          pageLabel={t.books.page}
          imageAlt={book ? `${book.title} – vergrößerte Vorschauseite` : ''}
        />
      </DialogContent>
    </Dialog>
  )
}

function Lightbox({
  src,
  sources,
  onClose,
  onNavigate,
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  imageAlt,
}: {
  src: string | null
  sources: string[]
  onClose: () => void
  onNavigate: (src: string) => void
  label: string
  previousLabel: string
  nextLabel: string
  pageLabel: string
  imageAlt: string
}) {
  const currentIndex = src ? sources.indexOf(src) : -1
  const canNavigate = currentIndex >= 0 && sources.length > 1

  const navigateBy = useCallback((direction: -1 | 1) => {
    if (!canNavigate) return
    const nextIndex = (currentIndex + direction + sources.length) % sources.length
    onNavigate(sources[nextIndex])
  }, [canNavigate, currentIndex, onNavigate, sources])

  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') navigateBy(-1)
      if (e.key === 'ArrowRight') navigateBy(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose, navigateBy])

  if (!src) return null
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <img
        src={src}
        alt={`${imageAlt} ${currentIndex + 1}`}
        className="max-h-[80vh] max-w-full rounded-sm bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigateBy(-1)
            }}
            aria-label={previousLabel}
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 sm:left-6 sm:h-14 sm:w-14"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigateBy(1)
            }}
            aria-label={nextLabel}
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 sm:right-6 sm:h-14 sm:w-14"
          >
            <ArrowRight className="h-6 w-6" aria-hidden />
          </button>
          <p
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white shadow-lg"
            aria-live="polite"
            aria-label={`${pageLabel} ${currentIndex + 1} / ${sources.length}`}
          >
            {currentIndex + 1} / {sources.length}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        autoFocus
        aria-label={label}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-foreground shadow-lg transition-transform hover:scale-105"
      >
        <X className="h-5 w-5" aria-hidden />
        {label}
      </button>
    </div>
  )
}

function setBookParam(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('buch', id)
  else url.searchParams.delete('buch')
  window.history.replaceState(null, '', url)
}

export default function Books() {
  const lang = useLang()
  const t = textsFor(lang)

  // Deep-Link beim ersten Laden direkt als Startzustand lesen (?buch=david).
  // Ungültige IDs werden ignoriert – die Seite bleibt benutzbar.
  const [active, setActive] = useState<Book | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return BOOKS.find((b) => b.id === params.get('buch')) ?? null
  })
  const [cat, setCat] = useState<Category | 'alle'>('alle')
  const [zoom, setZoom] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    const found = BOOKS.find((b) => b.id === params.get('buch'))
    const z = Number(params.get('zoom'))
    return found && z >= 1 && found.samples[z - 1] ? found.samples[z - 1] : null
  })

  const openBook = (b: Book) => {
    setActive(b)
    setBookParam(b.id)
  }

  const closeBook = () => {
    setActive(null)
    setZoom(null)
    setBookParam(null) // URL beim Schließen bereinigen
  }

  // Strikte Trennung: die englische Seite zeigt nur englische Bücher (und umgekehrt)
  const books = BOOKS.filter((b) => b.lang === lang)

  // Klick auf das 3D-Buch im Hero öffnet den Dialog des gezeigten Buches
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      const found = BOOKS.find((b) => b.id === id)
      if (found) openBook(found)
    }
    window.addEventListener(OPEN_BOOK_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_BOOK_EVENT, onOpen)
  })

  const visible = cat === 'alle' ? books : books.filter((b) => b.category === cat)

  const catLabel = (id: Category | 'alle'): string =>
    id === 'alle' ? t.books.all : catLabelOf(id, lang)
  const typeLabel = (b: Book): string => typeLabelOf(b, lang)
  const catColor = (id: Category | 'alle'): string | undefined =>
    id === 'alle' ? undefined : catDefOf(id)?.color

  const emptyHint = (id: Category | 'alle'): string =>
    id === 'alle' ? t.books.emptyAll : t.books.emptyComics

  return (
    <section id="buecher" className="scroll-mt-28 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.books.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.books.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.books.subtitle}</p>
        </Reveal>

        {/* Kategorien */}
        <Reveal delay={100} className="mt-9 flex flex-wrap justify-center gap-2.5">
          {(['alle', ...CATEGORIES.map((c) => c.id).filter((id) => books.some((b) => b.category === id))] as const).map((id) => {
            const count = id === 'alle' ? books.length : books.filter((b) => b.category === id).length
            const activeTab = cat === id
            const color = catColor(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCat(id)}
                aria-pressed={activeTab}
                style={activeTab && color ? { backgroundColor: color, borderColor: color, color: '#fff' } : undefined}
                className={`rounded-full border-2 px-5 py-2 text-sm font-bold transition-all ${
                  activeTab
                    ? color
                      ? 'shadow-md'
                      : 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {catLabel(id)}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    activeTab ? 'bg-white/25' : 'bg-secondary'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </Reveal>

        {visible.length > 0 ? (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((b, i) => (
              <Reveal key={b.id} delay={i * 100}>
                <article className="group flex h-full flex-col overflow-hidden rounded-md border-2 border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
                  <button
                    type="button"
                    onClick={() => openBook(b)}
                    className="relative block bg-secondary/50 p-6 text-left"
                    aria-label={`${t.books.lookInside}: ${b.title}`}
                  >
                    {isNew(b) && (
                      <span className="absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow">
                        {t.books.newBadge}
                      </span>
                    )}
                    <img
                      src={b.cover}
                      alt={b.title}
                      loading="lazy"
                      className="mx-auto max-h-72 w-auto max-w-full rounded-md object-contain shadow-lg shadow-primary/15 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-bold text-background opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      {t.books.lookInside}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="gap-1 rounded-full">
                        <Palette className="h-3 w-3" aria-hidden />
                        {typeLabel(b)}
                      </Badge>
                      {b.age && <Badge variant="secondary" className="rounded-full">{b.age}</Badge>}
                    </div>
                    <h3 className="font-display text-xl font-semibold leading-snug">{b.title}</h3>
                    {b.series && <p className="mt-1 text-xs font-semibold text-muted-foreground">{b.series}</p>}
                    <AmazonRating book={b} />
                    <div className="mt-4 flex flex-1 flex-col items-center">
                      <button
                        type="button"
                        onClick={() => openBook(b)}
                        className="mb-3 flex aspect-[900/165] w-full max-w-[240px] items-center justify-center rounded-full border-2 border-primary/20 text-sm font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        {t.books.lookInside}
                      </button>
                      <BuyButton book={b} />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-10">
            <div className="mx-auto max-w-lg rounded-2xl border border-accent/35 bg-gradient-to-b from-accent/10 to-accent/5 px-8 py-14 text-center shadow-sm">
              {cat !== 'alle' && (
                <p className="font-display text-2xl font-semibold">
                  {catLabel(cat)} – {t.books.comingSoonSuffix}
                </p>
              )}
              <p className={cat === 'alle' ? 'font-display text-2xl font-semibold' : 'mt-3 text-muted-foreground'}>
                {emptyHint(cat)}
              </p>
            </div>
          </Reveal>
        )}

        {lang === 'de' && (
          <Reveal delay={200} className="mt-12 rounded-2xl border border-accent/35 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 px-6 py-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">
              <span className="mr-2 font-bold text-foreground">{t.books.growing}</span>
              {' '}
              {COMING_SOON.join(' · ')}
            </p>
          </Reveal>
        )}
      </div>

      <BookDialog
        book={active}
        onClose={closeBook}
        onZoom={setZoom}
        zoom={zoom}
        onZoomClose={() => setZoom(null)}
      />
    </section>
  )
}

export { BuyButton }
