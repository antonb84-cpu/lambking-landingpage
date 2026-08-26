import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Palette, Star, X, ZoomIn } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { BOOKS, CATEGORIES, COMING_SOON, isNew, type Book, type Category } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

function TikTokIcon({ className }: { className?: string }) {
  const d =
    'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z'
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={d} fill="#25F4EE" transform="translate(-0.7 0.5)" />
      <path d={d} fill="#FE2C55" transform="translate(0.7 -0.5)" />
      <path d={d} fill="#ffffff" />
    </svg>
  )
}

function BuyButtons({ book, size = 'md' }: { book: Book; size?: 'md' | 'lg' }) {
  const t = textsFor(useLang())
  const h = size === 'lg' ? 'h-12 sm:h-14' : 'h-10 sm:h-11'
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <a
        href={book.amazon}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block transition-transform hover:scale-[1.05]"
        aria-label={`${book.title} – ${t.buy.amazon}`}
      >
        <img src="/images/buttons/amazon.png" alt={t.buy.amazon} className={`${h} w-auto`} />
      </a>
      {book.tiktok ? (
        <a
          href={book.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform hover:scale-[1.05]"
          aria-label={`${book.title} – ${t.buy.tiktok}`}
        >
          <img src="/images/buttons/tiktok.png" alt={t.buy.tiktok} className={`${h} w-auto`} />
        </a>
      ) : (
        <span
          className="inline-flex cursor-default items-center gap-2.5 rounded-full border-2 border-dashed border-foreground/15 px-5 py-2.5 text-sm font-semibold text-muted-foreground"
          title={t.books.tiktokSoonTitle}
        >
          <TikTokIcon className="h-4 w-4" />
          {t.books.tiktokSoon}
        </span>
      )}
    </div>
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
  const zoomOpen = !!zoom
  return (
    <Dialog open={!!book} onOpenChange={(open) => !open && !zoomOpen && onClose()}>
      <DialogContent
        className="max-h-[92vh] w-[94vw] max-w-5xl overflow-y-auto rounded-md border-2 bg-background p-0"
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
                  <Badge variant="secondary" className="rounded-full">{book.type}</Badge>
                  <Badge variant="secondary" className="rounded-full">{book.age}</Badge>
                  <Badge variant="secondary" className="rounded-full">{book.detail}</Badge>
                  {book.rating && (
                    <Badge className="rounded-full bg-accent/15 text-accent hover:bg-accent/15">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {book.rating}
                    </Badge>
                  )}
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
              <p className="mt-6 max-w-2xl text-lg leading-loose text-muted-foreground">
                {book.description}
              </p>
              <ul className="mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2">
                {book.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>
              {book.samples.length > 0 && (
                <>
                  <p className="mb-3 mt-9 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t.books.samplesHint}
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {book.samples.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onZoom(s)}
                        className="group relative block rounded-md border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
                      >
                        <img
                          src={s}
                          alt={`${book.title}`}
                          className="w-full rounded-md"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-3.5 w-3.5" />
                          {t.books.zoom}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t-2 border-border pt-7">
                {book.price ? (
                  <p className="font-display text-3xl font-semibold">{book.price}</p>
                ) : (
                  <p className="font-semibold text-muted-foreground">{t.books.seePrice}</p>
                )}
                <BuyButtons book={book} size="lg" />
              </div>
            </div>
          </div>
        )}
        <Lightbox src={zoom} onClose={onZoomClose} label={t.books.backToBook} />
      </DialogContent>
    </Dialog>
  )
}

function Lightbox({ src, onClose, label }: { src: string | null; onClose: () => void; label: string }) {
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])

  if (!src) return null
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label={label}
    >
      <img
        src={src}
        alt={label}
        className="max-h-[80vh] max-w-full rounded-sm bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={label}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-foreground shadow-lg transition-transform hover:scale-105"
      >
        <X className="h-5 w-5" />
        {label}
      </button>
    </div>
  )
}

export default function Books() {
  const lang = useLang()
  const t = textsFor(lang)
  const [active, setActive] = useState<Book | null>(null)
  const [cat, setCat] = useState<Category | 'alle'>('alle')
  const [zoom, setZoom] = useState<string | null>(null)

  // Bücher der aktiven Sprache (Fallback: alle, falls es in der Sprache noch keine gibt)
  const langBooks = BOOKS.filter((b) => b.lang === lang)
  const books = langBooks.length > 0 ? langBooks : BOOKS

  // Deep-Link: ?buch=david öffnet das Buch-Fenster direkt (z. B. aus der App oder Social Media)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const found = BOOKS.find((b) => b.id === params.get('buch'))
    if (found) {
      setActive(found)
      const z = Number(params.get('zoom'))
      if (z >= 1 && found.samples[z - 1]) setZoom(found.samples[z - 1])
    }
  }, [])

  const visible = cat === 'alle' ? books : books.filter((b) => b.category === cat)

  const catLabel = (id: Category | 'alle'): string =>
    id === 'alle' ? t.books.all : t.books.categories[id]

  const emptyHint = (id: Category | 'alle'): string =>
    id === 'komics' ? t.books.emptyKomis : t.books.emptyAll

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
          {(['alle', ...CATEGORIES.map((c) => c.id)] as const).map((id) => {
            const count = id === 'alle' ? books.length : books.filter((b) => b.category === id).length
            const activeTab = cat === id
            return (
              <button
                key={id}
                onClick={() => setCat(id)}
                className={`rounded-full border-2 px-5 py-2 text-sm font-bold transition-all ${
                  activeTab
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {catLabel(id)}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    activeTab ? 'bg-primary-foreground/20' : 'bg-secondary'
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
                    onClick={() => setActive(b)}
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
                      <Eye className="h-3.5 w-3.5" />
                      {t.books.lookInside}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="gap-1 rounded-full">
                        <Palette className="h-3 w-3" />
                        {b.type}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full">{b.age}</Badge>
                    </div>
                    <h3 className="font-display text-xl font-semibold leading-snug">{b.title}</h3>
                    {b.series && <p className="mt-1 text-xs font-semibold text-muted-foreground">{b.series}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      {b.price ? (
                        <p className="font-display text-lg font-semibold">{b.price}</p>
                      ) : (
                        <p className="text-xs font-semibold text-muted-foreground">{t.books.priceOnAmazon}</p>
                      )}
                      {b.rating && (
                        <p className="flex items-center gap-1 text-xs font-bold text-accent">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {b.rating}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex-1">
                      <button
                        onClick={() => setActive(b)}
                        className="mb-3 w-full rounded-full border-2 border-primary/20 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        {t.books.lookInside}
                      </button>
                      <BuyButtons book={b} />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-10">
            <div className="mx-auto max-w-lg rounded-2xl border border-accent/35 bg-gradient-to-b from-accent/10 to-accent/5 px-8 py-14 text-center shadow-sm">
              <p className="font-display text-2xl font-semibold">
                {catLabel(cat)} – {t.books.comingSoonSuffix}
              </p>
              <p className="mt-3 text-muted-foreground">{emptyHint(cat)}</p>
            </div>
          </Reveal>
        )}

        <Reveal delay={200} className="mt-12 rounded-2xl border border-accent/35 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">
            <span className="mr-2 font-bold text-foreground">{t.books.growing}</span>
            {COMING_SOON.join(' · ')}
          </p>
        </Reveal>
      </div>

      <BookDialog
        book={active}
        onClose={() => setActive(null)}
        onZoom={setZoom}
        zoom={zoom}
        onZoomClose={() => setZoom(null)}
      />
    </section>
  )
}

export { BuyButtons }
