import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Eye, HelpCircle, Languages, Palette, Ruler, ShieldCheck, X, ZoomIn } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import AmazonRating from '@/components/AmazonRating'
import { BOOKS, CATEGORIES, COMING_SOON, isNew, type Book, type Category } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { OPEN_BOOK_EVENT } from '@/data/openBook'
import { trackAmazonClick } from '@/data/analytics'
import deFlag from 'flag-icons/flags/4x3/de.svg'
import gbFlag from 'flag-icons/flags/4x3/gb.svg'
import esFlag from 'flag-icons/flags/4x3/es.svg'
import frFlag from 'flag-icons/flags/4x3/fr.svg'
import itFlag from 'flag-icons/flags/4x3/it.svg'
import ptFlag from 'flag-icons/flags/4x3/pt.svg'
import ruFlag from 'flag-icons/flags/4x3/ru.svg'
import jpFlag from 'flag-icons/flags/4x3/jp.svg'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import plFlag from 'flag-icons/flags/4x3/pl.svg'
import nlFlag from 'flag-icons/flags/4x3/nl.svg'
import trFlag from 'flag-icons/flags/4x3/tr.svg'
import uaFlag from 'flag-icons/flags/4x3/ua.svg'
import saFlag from 'flag-icons/flags/4x3/sa.svg'
import inFlag from 'flag-icons/flags/4x3/in.svg'
import seFlag from 'flag-icons/flags/4x3/se.svg'
import dkFlag from 'flag-icons/flags/4x3/dk.svg'
import noFlag from 'flag-icons/flags/4x3/no.svg'
import fiFlag from 'flag-icons/flags/4x3/fi.svg'

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

const LANGUAGE_META: Record<string, { flag: string; de: string; en: string }> = {
  de: { flag: deFlag, de: 'Deutsch', en: 'German' }, en: { flag: gbFlag, de: 'Englisch', en: 'English' },
  es: { flag: esFlag, de: 'Spanisch', en: 'Spanish' }, fr: { flag: frFlag, de: 'Französisch', en: 'French' },
  it: { flag: itFlag, de: 'Italienisch', en: 'Italian' }, pt: { flag: ptFlag, de: 'Portugiesisch', en: 'Portuguese' },
  ru: { flag: ruFlag, de: 'Russisch', en: 'Russian' }, ja: { flag: jpFlag, de: 'Japanisch', en: 'Japanese' },
  zh: { flag: cnFlag, de: 'Chinesisch', en: 'Chinese' }, ko: { flag: krFlag, de: 'Koreanisch', en: 'Korean' },
  pl: { flag: plFlag, de: 'Polnisch', en: 'Polish' }, nl: { flag: nlFlag, de: 'Niederländisch', en: 'Dutch' },
  tr: { flag: trFlag, de: 'Türkisch', en: 'Turkish' }, uk: { flag: uaFlag, de: 'Ukrainisch', en: 'Ukrainian' },
  ar: { flag: saFlag, de: 'Arabisch', en: 'Arabic' }, hi: { flag: inFlag, de: 'Hindi', en: 'Hindi' },
  sv: { flag: seFlag, de: 'Schwedisch', en: 'Swedish' }, da: { flag: dkFlag, de: 'Dänisch', en: 'Danish' },
  no: { flag: noFlag, de: 'Norwegisch', en: 'Norwegian' }, fi: { flag: fiFlag, de: 'Finnisch', en: 'Finnish' },
}

const editionsOf = (book: Book) => book.editions?.length
  ? book.editions.filter((edition) => edition.language)
  : (book.amazon.startsWith('https://') ? [{ language: book.lang, amazon: book.amazon }] : [])

const localizedBook = (book: Book, language: string): Book => {
  const edition = editionsOf(book).find((item) => item.language === language)
  if (!edition) return book
  return {
    ...book,
    title: edition.title || book.title,
    series: edition.series || book.series,
    age: edition.age || book.age,
    detail: edition.detail || book.detail,
    description: edition.description || book.description,
    highlights: edition.highlights?.length ? edition.highlights : book.highlights,
    amazon: edition.amazon,
  }
}

const isColoringBook = (book: Book) => book.category === 'malbuecher'

function ColoringBookFacts({ compact = false }: { compact?: boolean }) {
  const t = textsFor(useLang())
  const icons = [BookOpen, Ruler, ShieldCheck, HelpCircle, Languages]
  return (
    <div className={compact
      ? 'mt-5 rounded-2xl border border-accent/30 bg-accent/[0.07] p-4'
      : 'rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/[0.09] via-card to-accent/[0.06] px-5 py-5 shadow-sm sm:px-7'}
    >
      <p className={`font-display font-semibold text-foreground ${compact ? 'text-lg' : 'text-center text-xl sm:text-2xl'}`}>
        {t.books.coloringFactsTitle}
      </p>
      <ul className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-5'}`}>
        {t.books.coloringFacts.map((fact, index) => {
          const Icon = icons[index] ?? CheckCircle2
          return (
            <li key={fact} className="flex items-center gap-2.5 text-sm font-bold leading-snug text-foreground">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Icon className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
              </span>
              <RichText text={fact} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LanguageEditions({
  book,
  compact = false,
  onSelect,
}: {
  book: Book
  compact?: boolean
  onSelect: (language: string) => void
}) {
  const lang = useLang()
  const t = textsFor(lang)
  const editions = editionsOf(book)
  if (!editions.length) return null
  return (
    <div className={`${compact ? 'mt-2.5' : 'mt-5'} text-center`}>
      <p className={`mb-1.5 font-semibold text-muted-foreground ${compact ? 'text-[10px] sm:text-xs' : 'text-xs'}`}>{t.books.availableLanguages}</p>
      <div className="flex flex-wrap justify-center gap-1">
        {editions.map((edition) => {
          const meta = LANGUAGE_META[edition.language]
          const name = meta ? meta[lang] : edition.language.toUpperCase()
          return (
            <button
              type="button"
              key={edition.language}
              onClick={() => onSelect(edition.language)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-white p-2 shadow-sm transition hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:shadow"
              title={`${name} – ${t.books.lookInside}`}
              aria-label={`${book.title}, ${name} – ${t.books.lookInside}`}
            >
              {meta
                ? <img src={meta.flag} alt="" className="h-full w-full rounded-full object-cover shadow-sm" aria-hidden />
                : <span className="text-lg leading-none" aria-hidden>🌐</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BuyButton({ book, size = 'md', preferredLanguage }: { book: Book; size?: 'md' | 'lg'; preferredLanguage?: string }) {
  const lang = useLang()
  const t = textsFor(lang)
  const width = size === 'lg' ? 'max-w-[305px]' : 'max-w-[240px]'
  const editions = editionsOf(book).filter((item) => item.amazon.startsWith('https://'))
  const edition = preferredLanguage
    ? editions.find((item) => item.language === preferredLanguage)
    : editions.find((item) => item.language === lang)
      ?? editions.find((item) => item.language === book.lang)
      ?? editions[0]
  // Kein gültiger Amazon-Link → kein kaputter Button
  if (!edition) return null
  return (
    <a
      href={edition.amazon}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAmazonClick(`${book.id}:${edition.language}`)}
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
  editionLanguage,
  onEditionChange,
}: {
  book: Book | null
  onClose: () => void
  onZoom: (src: string) => void
  zoom: string | null
  onZoomClose: () => void
  editionLanguage: string | null
  onEditionChange: (language: string) => void
}) {
  const t = textsFor(useLang())
  const lang = useLang()
  const zoomOpen = !!zoom
  const edition = book ? editionsOf(book).find((item) => item.language === editionLanguage) : undefined
  const displayBook = book && edition ? {
    ...book,
    title: edition.title || book.title,
    series: edition.series || book.series,
    age: edition.age || book.age,
    detail: edition.detail || book.detail,
    description: edition.description || book.description,
    highlights: edition.highlights?.length ? edition.highlights : book.highlights,
    amazon: edition.amazon,
    editions: [edition],
  } : book
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
                  {isColoringBook(book) ? (
                    <>
                      <Badge variant="secondary" className="rounded-full">{t.books.coloringAge}</Badge>
                      <Badge variant="secondary" className="rounded-full">{t.books.coloringFormat}</Badge>
                    </>
                  ) : (
                    <>
                      {displayBook?.age && <Badge variant="secondary" className="rounded-full">{displayBook.age}</Badge>}
                      {displayBook?.detail && <Badge variant="secondary" className="rounded-full">{displayBook.detail}</Badge>}
                    </>
                  )}
                </div>
                <DialogTitle className="font-display text-3xl font-semibold leading-tight lg:text-4xl">
                  {displayBook?.title}
                </DialogTitle>
                {displayBook?.series && (
                  <p className="pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {displayBook.series}
                  </p>
                )}
              </DialogHeader>
              {isColoringBook(book) ? <ColoringBookFacts compact /> : null}
              <DialogDescription className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-loose text-muted-foreground">
                <RichText text={displayBook?.description || ''} />
              </DialogDescription>
              <ul className="mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2">
                {(displayBook?.highlights || []).map((h) => (
                  <li key={h} className="flex items-center gap-2.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                    <RichText text={h} />
                  </li>
                ))}
              </ul>
              {displayBook && <AmazonRating book={displayBook} />}
              <LanguageEditions book={book} onSelect={onEditionChange} />
              {edition && !edition.amazon.startsWith('https://') && (
                <p className="mx-auto mt-5 max-w-md rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {t.books.amazonPending}
                </p>
              )}
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
                          alt={`${book.title} – ${t.books.samplePage} ${index + 1}`}
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
                {displayBook && <BuyButton book={displayBook} size="lg" preferredLanguage={editionLanguage || undefined} />}
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
          imageAlt={book ? `${book.title} – ${t.books.enlargedSamplePage}` : ''}
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
  const [activeEdition, setActiveEdition] = useState<string | null>(null)
  const [cat, setCat] = useState<Category | 'alle'>('alle')
  const [zoom, setZoom] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    const found = BOOKS.find((b) => b.id === params.get('buch'))
    const z = Number(params.get('zoom'))
    return found && z >= 1 && found.samples[z - 1] ? found.samples[z - 1] : null
  })

  const openBook = (b: Book, editionLanguage?: string) => {
    setActive(b)
    const editions = editionsOf(b)
    setActiveEdition(editionLanguage
      ?? editions.find((item) => item.language === lang)?.language
      ?? editions.find((item) => item.language === b.lang)?.language
      ?? editions[0]?.language
      ?? null)
    setBookParam(b.id)
  }

  const closeBook = () => {
    setActive(null)
    setActiveEdition(null)
    setZoom(null)
    setBookParam(null) // URL beim Schließen bereinigen
  }

  // Strikte Trennung: die englische Seite zeigt nur englische Bücher (und umgekehrt)
  const books = BOOKS.filter((b) => b.lang === lang || editionsOf(b).some((edition) => edition.language === lang))

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
    <section id="buecher" className="scroll-mt-28 py-14 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.books.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.books.title}
          </h2>
          <p className="mt-3 text-muted-foreground"><RichText text={t.books.subtitle} /></p>
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

        {(cat === 'alle' || cat === 'malbuecher') && books.some(isColoringBook) ? (
          <Reveal delay={130} className="mt-7">
            <ColoringBookFacts />
          </Reveal>
        ) : null}

        {visible.length > 0 ? (
          <div className="mt-9 grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-3">
            {visible.map((b, i) => {
              const cardBook = localizedBook(b, lang)
              return (
              <Reveal key={b.id} delay={i * 100}>
                <article className="book-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_32px_-26px_rgba(21,49,103,0.8)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_38px_-24px_rgba(21,49,103,0.45)]">
                  <button
                    type="button"
                    onClick={() => openBook(b)}
                    className="relative flex aspect-[4/5] items-center justify-center bg-secondary/45 p-2.5 text-left sm:p-5"
                    aria-label={`${t.books.lookInside}: ${b.title}`}
                  >
                    {isNew(b) && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground shadow sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
                        {t.books.newBadge}
                      </span>
                    )}
                    <img
                      src={b.cover}
                      alt={cardBook.title}
                      loading="lazy"
                      className="max-h-full w-auto max-w-full rounded-md object-contain shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-bold text-background opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      {t.books.lookInside}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-2.5 sm:p-5">
                    <div className="mb-2 hidden flex-wrap gap-1.5 sm:flex">
                      <Badge variant="secondary" className="gap-1 rounded-full">
                        <Palette className="h-3 w-3" aria-hidden />
                        {typeLabel(b)}
                      </Badge>
                      {isColoringBook(b)
                        ? <Badge variant="secondary" className="rounded-full">{t.books.coloringAge}</Badge>
                        : cardBook.age && <Badge variant="secondary" className="rounded-full">{cardBook.age}</Badge>}
                    </div>
                    <h3 className="book-card-title font-display text-sm font-semibold leading-snug sm:text-xl">{cardBook.title}</h3>
                    {isColoringBook(b) ? (
                      <p className="mt-2 text-[10px] font-bold leading-snug text-primary sm:text-xs">
                        {t.books.coloringCardSummary}
                      </p>
                    ) : null}
                    <LanguageEditions book={b} compact onSelect={(language) => openBook(b, language)} />
                    <div className="hidden sm:block"><AmazonRating book={b} /></div>
                    <div className="mt-3 flex flex-1 flex-col items-center justify-end sm:mt-4">
                      <button
                        type="button"
                        onClick={() => openBook(b)}
                        className="flex min-h-11 w-full max-w-[240px] items-center justify-center rounded-full bg-primary px-2 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:aspect-[900/165] sm:text-sm"
                      >
                        {t.books.lookInside}
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
              )
            })}
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
        editionLanguage={activeEdition}
        onEditionChange={setActiveEdition}
      />
    </section>
  )
}

export { BuyButton }
