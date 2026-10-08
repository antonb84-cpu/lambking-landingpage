import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Copy, HelpCircle, Languages, Mail, PackageCheck, Palette, Play, Ruler, ShieldCheck, ChevronDown, X, ScrollText } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import AmazonRating from '@/components/AmazonRating'
import { BOOKS, CATEGORIES, COMING_SOON, SITE, isNew, type Book } from '@/data/books'
import { useLang } from '@/data/lang'
import { LANGUAGE_META } from '@/data/languageMeta'
import { textsFor } from '@/data/texts'
import { OPEN_BOOK_EVENT, openFlipBookById } from '@/data/openBook'
import { BULK_DISCOUNT_TIERS } from '@/data/bulk'
import BuyButton from '@/components/BuyButton'
import { coverFor } from '@/data/covers'
import { editionsOf } from '@/data/editions'
import { hasFlipbook } from '@/data/flipbooks'
import { splitTitle, volumeLabel } from '@/data/titles'
import { bookIdFromLocation, bookPath, isBookPath } from '@/data/bookLink'

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


type BooksCopy = ReturnType<typeof textsFor>['books']
const editionCopyOverrides: Record<string, Partial<BooksCopy>> = {
  es: {
    seePrice: 'Consultar el precio actual en Amazon', samplesHint: 'Mira el interior – haz clic para ampliar',
    samplePage: 'Página de muestra', enlargedSamplePage: 'página de muestra ampliada', zoom: 'Ampliar',
    backToBook: 'Volver al libro', previousPage: 'Página anterior', nextPage: 'Página siguiente', page: 'Página',
    buyAmazon: 'Ver en Amazon', availableLanguages: 'Disponible en',
    bookInfoTitle: 'Datos del libro', mediaGallery: 'Galería del libro', mediaCover: 'Portada',
    mediaLifestyle: 'Foto del libro (imagen ilustrativa)', mediaVideo: 'Reproducir vídeo del libro',
    mediaSwipeHint: 'Desliza o usa las flechas', previousImage: 'Imagen anterior', nextImage: 'Imagen siguiente',
    coloringFactsTitle: 'Qué contiene cada libro para colorear de LambKing',
    coloringFacts: ['Mínimo 70 páginas', 'Tamaño aprox. DIN A4', 'Fiel a la Biblia', 'Además, 5 páginas con juegos, preguntas y pasatiempos', 'Disponible en varios idiomas'],
    coloringAge: 'A partir de 6 años', coloringFormat: 'Mínimo 70 páginas · aprox. DIN A4',
    amazonPending: 'Aún no hay un enlace de Amazon para esta edición. El botón de compra aparecerá cuando se añada en la administración.',
  },
  ro: {
    seePrice: 'Vezi prețul actual pe Amazon', samplesHint: 'Răsfoiește cartea – apasă pentru a mări',
    samplePage: 'Pagină de prezentare', enlargedSamplePage: 'pagină de prezentare mărită', zoom: 'Mărește',
    backToBook: 'Înapoi la carte', previousPage: 'Pagina anterioară', nextPage: 'Pagina următoare', page: 'Pagina',
    buyAmazon: 'Vezi pe Amazon', availableLanguages: 'Disponibilă în',
    bookInfoTitle: 'Pe scurt despre carte', mediaGallery: 'Galeria cărții', mediaCover: 'Copertă',
    mediaLifestyle: 'Fotografie a cărții (imagine ilustrativă)', mediaVideo: 'Redă videoclipul cărții',
    mediaSwipeHint: 'Glisează sau folosește săgețile', previousImage: 'Imaginea precedentă', nextImage: 'Imaginea următoare',
    coloringFactsTitle: 'Ce conține fiecare carte de colorat LambKing',
    coloringFacts: ['Minimum 70 de pagini', 'Mărime aprox. DIN A4', 'Fidelă Bibliei', 'În plus, 5 pagini cu jocuri, întrebări și puzzle-uri', 'Disponibilă în mai multe limbi'],
    coloringAge: 'De la 6 ani', coloringFormat: 'Minimum 70 de pagini · aprox. DIN A4',
    amazonPending: 'Nu există încă un link Amazon pentru această ediție. Butonul de cumpărare va apărea după adăugarea linkului în administrare.',
  },
}

const booksCopyForEdition = (siteLanguage: 'de' | 'en', editionLanguage: string | null): BooksCopy => {
  if (editionLanguage === 'de' || editionLanguage === 'en') return textsFor(editionLanguage).books
  return { ...textsFor(siteLanguage).books, ...(editionLanguage ? editionCopyOverrides[editionLanguage] : {}) }
}

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
    samples: edition.samples?.length ? edition.samples : book.samples,
    amazon: edition.amazon,
    cover: coverFor(book, edition).src,
    coverFront: undefined,
    coverSpread: coverFor(book, edition).spread,
    lifestyleImages: edition.lifestyleImages ?? (edition.language === book.lang ? book.lifestyleImages : []),
    previewVideo: edition.previewVideo ?? (edition.language === book.lang ? book.previewVideo : undefined),
  }
}

function highlightIcon(text: string) {
  if (/bibelstelle|bible passage|pasaje|pasaj/i.test(text)) return ScrollText
  if (/seite|page|página|pagin/i.test(text)) return BookOpen
  if (/ausmal|color|colorear|colorat/i.test(text)) return Palette
  if (/sprach|language|idioma|limb/i.test(text)) return Languages
  return CheckCircle2
}

function BookCover({ book, variant }: { book: Book; variant: 'card' | 'dialog' }) {
  const { src: coverSrc, spread: coverIsSpread } = coverFor(book)
  const shared = variant === 'card'
    ? 'max-h-full w-auto max-w-full rounded-[3px] shadow-[0_1px_2px_rgba(21,30,60,0.35),0_10px_14px_-6px_rgba(21,49,103,0.45),0_26px_30px_-14px_rgba(21,49,103,0.4)] transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:-rotate-1 group-hover:scale-[1.03] group-hover:shadow-[0_2px_3px_rgba(21,30,60,0.35),0_16px_20px_-6px_rgba(21,49,103,0.5),0_38px_40px_-14px_rgba(21,49,103,0.45)]'
    : 'mx-auto w-full max-w-[320px] rounded-[3px] shadow-2xl shadow-primary/25 lg:sticky lg:top-10'
  // Softcover: heller Falz am Buchrücken und leichter Glanz, keine harte Hardcover-Kante
  const crease = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-[6%] rounded-l-[3px] bg-gradient-to-r from-black/25 via-white/20 to-transparent"
    />
  )

  if (!coverIsSpread) {
    return (
      <span className="relative inline-flex max-h-full max-w-full">
        <img src={coverSrc} alt={book.title} loading={variant === 'card' ? 'lazy' : undefined} className={shared} />
        {crease}
      </span>
    )
  }

  return (
    <div
      className={`${shared} relative aspect-[8.5/11] overflow-hidden ${variant === 'card' ? 'h-full' : ''}`}
      role="img"
      aria-label={book.title}
    >
      <img
        src={coverSrc}
        alt=""
        aria-hidden
        loading={variant === 'card' ? 'lazy' : undefined}
        className="absolute right-0 top-0 h-full w-auto max-w-none"
      />
      {crease}
    </div>
  )
}

function BookMediaGallery({ book, onZoom, copy }: { book: Book; onZoom: (src: string) => void; copy: BooksCopy }) {
  const [index, setIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const slides = [
    { kind: 'cover' as const, src: coverFor(book).src, label: copy.mediaCover },
    ...(book.lifestyleImages ?? []).map((src) => ({ kind: 'lifestyle' as const, src, label: copy.mediaLifestyle })),
    ...book.samples.map((src, sampleIndex) => ({ kind: 'sample' as const, src, label: `${copy.samplePage} ${sampleIndex + 1}` })),
    ...(book.previewVideo ? [{ kind: 'video' as const, src: book.previewVideo, label: copy.mediaVideo }] : []),
  ]
  const current = slides[Math.min(index, slides.length - 1)]
  const move = (direction: -1 | 1) => setIndex((value) => (value + direction + slides.length) % slides.length)

  return (
    <div className="min-w-0 bg-secondary/60 px-5 pb-5 pt-8 lg:sticky lg:top-0 lg:self-start lg:px-7 lg:pt-10" aria-label={`${book.title} – ${copy.mediaGallery}`}>
      <div
        className="relative flex min-h-[260px] items-center justify-center sm:min-h-[390px]"
        onTouchStart={(event) => { touchStart.current = event.touches[0] ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null }}
        onTouchEnd={(event) => {
          if (!touchStart.current || !event.changedTouches[0]) return
          const deltaX = event.changedTouches[0].clientX - touchStart.current.x
          const deltaY = event.changedTouches[0].clientY - touchStart.current.y
          if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX < 0 ? 1 : -1)
          touchStart.current = null
        }}
      >
        {current.kind === 'cover' && <BookCover book={book} variant="dialog" />}
        {current.kind === 'lifestyle' && <img src={current.src} alt={`${book.title} – ${current.label}`} className="max-h-[440px] w-auto max-w-full rounded-md object-contain shadow-xl" loading="lazy" />}
        {current.kind === 'sample' && (
          <button type="button" onClick={() => onZoom(current.src)} className="max-w-[320px] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60" aria-label={`${current.label} – ${copy.zoom}`}>
            <img src={current.src} alt={`${book.title} – ${current.label}`} className="max-h-[440px] w-auto rounded-md bg-white object-contain shadow-xl" loading="lazy" />
          </button>
        )}
        {current.kind === 'video' && <video key={current.src} controls playsInline preload="none" poster={book.lifestyleImages?.[0] ?? (book.coverSpread ? undefined : book.cover)} className="max-h-[440px] w-full rounded-md bg-black" aria-label={`${book.title} – ${copy.mediaVideo}`}><source src={current.src} />{copy.mediaVideo}</video>}
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" onClick={() => move(-1)} aria-label={copy.previousImage} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"><ArrowLeft className="size-5" aria-hidden /></button>
          <span className="min-w-0 text-center text-xs font-semibold text-muted-foreground" aria-live="polite">{current.label} · {index + 1}/{slides.length}</span>
          <button type="button" onClick={() => move(1)} aria-label={copy.nextImage} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"><ArrowRight className="size-5" aria-hidden /></button>
        </div>
      )}
      {slides.length > 1 && <p className="mt-2 text-center text-xs text-muted-foreground">{copy.mediaSwipeHint}</p>}
      {book.previewVideo && current.kind !== 'video' && <button type="button" onClick={() => setIndex(slides.length - 1)} className="mx-auto mt-3 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"><Play className="size-4" aria-hidden />{copy.mediaVideo}</button>}
    </div>
  )
}

const isColoringBook = (book: Book) => book.category === 'malbuecher'

function ColoringBookFacts() {
  const siteCopy = textsFor(useLang()).books
  const icons = [BookOpen, Ruler, ShieldCheck, HelpCircle, Languages]
  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/[0.09] via-card to-accent/[0.06] px-5 py-5 shadow-sm sm:px-7">
      <p className="text-center font-display text-xl font-semibold text-foreground sm:text-2xl">
        {siteCopy.coloringFactsTitle}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {siteCopy.coloringFacts.map((fact, index) => {
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
  label,
  onSelect,
}: {
  book: Book
  compact?: boolean
  label?: string
  onSelect: (language: string) => void
}) {
  const lang = useLang()
  const t = textsFor(lang)
  const editions = editionsOf(book)
  if (!editions.length) return null
  return (
    <div className={`${compact ? 'mt-2.5' : 'mt-5'} text-center`}>
      {label === '' ? null : <p className={`mb-1.5 font-semibold text-muted-foreground ${compact ? 'text-[10px] sm:text-xs' : 'text-xs'}`}>{label ?? t.books.availableLanguages}</p>}
      <div className="flex flex-wrap justify-center gap-1">
        {editions.map((edition) => {
          const meta = LANGUAGE_META[edition.language]
          const name = meta ? meta[lang] : edition.language.toUpperCase()
          return (
            <button
              type="button"
              key={edition.language}
              onClick={() => onSelect(edition.language)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-white p-1.5 shadow-sm transition before:absolute before:-inset-1 before:content-[''] hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:shadow"
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

function BulkDiscountDialog({
  open,
  onOpenChange,
  bookTitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookTitle: string
}) {
  const lang = useLang()
  const copy = textsFor(lang).books
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const subject = `${copy.bulkDiscountEmailSubject}: ${bookTitle}`
  const emailHref = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}`

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setCopyState('idle')
    onOpenChange(nextOpen)
  }

  const copyEmailAddress = async () => {
    setCopyState('copying')
    const textarea = document.createElement('textarea')
    textarea.value = SITE.contactEmail
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    let copied = document.execCommand('copy')
    textarea.remove()

    if (!copied && navigator.clipboard?.writeText) {
      copied = await Promise.race([
        navigator.clipboard.writeText(SITE.contactEmail).then(() => true).catch(() => false),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 800)),
      ])
    }
    setCopyState(copied ? 'copied' : 'error')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[92vw] max-w-lg rounded-2xl border-2 bg-background p-6 sm:p-8">
        <DialogHeader className="pr-8 text-left">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-primary">
            <PackageCheck className="h-6 w-6" aria-hidden />
          </div>
          <DialogTitle className="font-display text-2xl font-semibold sm:text-3xl">
            {copy.bulkDiscountTitle}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base leading-relaxed">
            {copy.bulkDiscountIntro}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-sm font-bold">{copy.bulkDiscountOrderHeader}</th>
                <th scope="col" className="px-4 py-3 text-right text-sm font-bold">{copy.bulkDiscountDiscountHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BULK_DISCOUNT_TIERS.map((tier) => (
                <tr key={tier.quantity} className="bg-card">
                  <td className="px-4 py-3 font-semibold">
                    {copy.bulkDiscountFrom} {tier.quantity} {copy.bulkDiscountPieces}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{tier.discount} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{copy.bulkDiscountContact}</p>
        <button
          type="button"
          onClick={copyEmailAddress}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
        >
          {copyState === 'copied'
            ? <CheckCircle2 className="h-5 w-5" aria-hidden />
            : <Copy className="h-5 w-5" aria-hidden />}
          {copy.bulkDiscountContactButton}
        </button>
        <div className="mt-3 text-center text-sm font-semibold" aria-live="polite" role="status">
          {copyState === 'copying' && <p className="text-muted-foreground">{copy.bulkDiscountCopying}</p>}
          {copyState === 'copied' && <p className="text-emerald-700">✓ {copy.bulkDiscountCopied}: {SITE.contactEmail}</p>}
          {copyState === 'error' && <p className="text-destructive">{copy.bulkDiscountCopyError}</p>}
          {copyState === 'idle' && <p className="select-all text-muted-foreground">{SITE.contactEmail}</p>}
        </div>
        <a
          href={emailHref}
          className="mx-auto mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {copy.bulkDiscountOpenMail}
        </a>
      </DialogContent>
    </Dialog>
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
  const lang = useLang()
  const [bulkDiscountOpen, setBulkDiscountOpen] = useState(false)
  const zoomOpen = !!zoom
  const edition = book ? editionsOf(book).find((item) => item.language === editionLanguage) : undefined
  const displayBook = book && edition ? localizedBook(book, edition.language) : book
  const dialogCopy = booksCopyForEdition(lang, editionLanguage)
  const siteCopy = textsFor(lang).books
  return (
    <>
    <Dialog open={!!book} onOpenChange={(open) => !open && !zoomOpen && !bulkDiscountOpen && onClose()}>
      <DialogContent
        className="max-h-[92vh] w-[94vw] max-w-5xl overflow-y-auto rounded-md border-2 bg-background p-0"
        closeButtonClassName="right-3 top-3 flex size-12 items-center justify-center rounded-full border border-primary/15 bg-white opacity-100 shadow-lg sm:right-4 sm:top-4 sm:size-10"
        closeButtonIconClassName="size-7 sm:size-5"
        onEscapeKeyDown={(e) => zoomOpen && e.preventDefault()}
        onPointerDownOutside={(e) => zoomOpen && e.preventDefault()}
      >
        {book && (
          <div className="grid lg:grid-cols-[380px_1fr]" lang={editionLanguage ?? lang}>
            {displayBook && <BookMediaGallery key={`${book.id}:${editionLanguage ?? lang}`} book={displayBook} onZoom={onZoom} copy={dialogCopy} />}
            <div className="p-8 lg:p-12">
              <DialogHeader>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{editionLanguage === 'es' && isColoringBook(book) ? 'Libro para colorear' : editionLanguage === 'ro' && isColoringBook(book) ? 'Carte de colorat' : typeLabelOf(book, editionLanguage === 'en' ? 'en' : 'de')}</Badge>
                  {displayBook?.detail ? <Badge variant="secondary" className="rounded-full">{displayBook.detail}</Badge> : null}
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
              <DialogDescription className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-loose text-muted-foreground">
                <RichText text={displayBook?.description || ''} />
              </DialogDescription>
              {book && hasFlipbook(book.id) ? (
                <button
                  type="button"
                  onClick={() => { onClose(); openFlipBookById(book.id) }}
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-card px-6 py-3 font-bold text-primary transition-colors hover:border-primary/50"
                >
                  <BookOpen className="h-5 w-5" aria-hidden />
                  {siteCopy.flipInside}
                </button>
              ) : null}
              {(displayBook?.highlights?.length ?? 0) > 0 && <p className="mt-6 font-display text-lg font-semibold text-foreground">{dialogCopy.bookInfoTitle}</p>}
              <ul className="mt-3 grid max-w-2xl gap-3 sm:grid-cols-2">
                {(displayBook?.highlights || []).map((h) => {
                  const Icon = highlightIcon(h)
                  return (
                    <li key={h} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 font-semibold leading-snug shadow-sm">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <RichText text={h} />
                    </li>
                  )
                })}
              </ul>
              {displayBook && <AmazonRating book={displayBook} />}
              <LanguageEditions book={book} label={dialogCopy.availableLanguages} onSelect={onEditionChange} />
              {edition && !edition.amazon.startsWith('https://') && (
                <p className="mx-auto mt-5 max-w-md rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {dialogCopy.amazonPending}
                </p>
              )}
              <div className="sticky bottom-0 z-10 -mx-8 mt-9 border-t-2 border-border bg-background/95 px-8 py-5 shadow-[0_-8px_20px_-16px_rgba(30,42,74,0.35)] backdrop-blur lg:-mx-12 lg:px-12">
                {edition?.amazon.startsWith('https://') && <p className="mb-3 text-center font-semibold text-muted-foreground sm:text-left">{dialogCopy.seePrice}</p>}
                <div className="mx-auto flex w-full flex-col items-center gap-3">
                  {displayBook && <BuyButton book={displayBook} size="lg" preferredLanguage={editionLanguage || undefined} label={dialogCopy.buyAmazon} />}
                  <button
                    type="button"
                    onClick={() => setBulkDiscountOpen(true)}
                    className="inline-flex min-h-12 aspect-[900/165] w-full max-w-[305px] items-center justify-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-5 py-3 text-center text-sm font-bold text-primary shadow-sm transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
                  >
                    <PackageCheck className="h-5 w-5" aria-hidden />
                    {siteCopy.bulkDiscountButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <Lightbox
          src={zoom}
          sources={displayBook?.samples ?? []}
          onClose={onZoomClose}
          onNavigate={onZoom}
          label={dialogCopy.backToBook}
          previousLabel={dialogCopy.previousPage}
          nextLabel={dialogCopy.nextPage}
          pageLabel={dialogCopy.page}
          imageAlt={displayBook ? `${displayBook.title} – ${dialogCopy.enlargedSamplePage}` : ''}
        />
      </DialogContent>
    </Dialog>
    <BulkDiscountDialog
      open={bulkDiscountOpen}
      onOpenChange={setBulkDiscountOpen}
      bookTitle={displayBook?.title ?? ''}
    />
    </>
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
  if (isBookPath()) {
    // Auf einer Buchseite (/buch/<name>/) bleibt die Adresse, solange das Fenster offen ist; beim Schließen geht es zur Startseite
    if (id) return
    window.history.replaceState(null, '', new URL('.', document.baseURI))
    return
  }
  if (id) url.searchParams.set('buch', id)
  else url.searchParams.delete('buch')
  window.history.replaceState(null, '', url)
}

// ── Marktstand: je Buchart ein eigener Stand; die Bücher stehen auf dem Tisch ──────────────
type StallScene = { src: string; base: string; x0: string; x1: string }
const STALL_SCENES: Record<string, StallScene> = {
  malbuecher: { src: 'images/markt/stand-malbuecher.webp', base: '79%', x0: '12%', x1: '12%' },
  geschichten: { src: 'images/markt/stand-bilderbuecher.webp', base: '70%', x0: '15%', x1: '17%' },
  komics: { src: 'images/markt/stand-comics.webp', base: '66%', x0: '12%', x1: '11%' },
  historisch: { src: 'images/markt/stand-geschichte.webp', base: '77%', x0: '11%', x1: '11%' },
}
const sceneFor = (categoryId: string): StallScene => STALL_SCENES[categoryId] ?? STALL_SCENES.malbuecher

// Altersgruppen innerhalb einer Buchart (Feld „Altersgruppe" im Admin)
const AGE_GROUPS: Record<string, { de: [string, string]; en: [string, string]; color: string }> = {
  '3+': { de: ['ab 3 Jahren', 'Zum Vorlesen'], en: ['ages 3+', 'Read-aloud'], color: '#c9712b' },
  '5-8': { de: ['5–8 Jahre', 'Kleine Entdecker'], en: ['ages 5–8', 'Little explorers'], color: '#4f9a3d' },
  '9-12': { de: ['9–12 Jahre', 'Bibelforscher'], en: ['ages 9–12', 'Bible explorers'], color: '#2a55a6' },
}
const AGE_ORDER = ['3+', '5-8', '9-12']

function splitByAge(items: Book[]): { key: string; items: Book[] }[] {
  const keys = [...new Set(items.map((b) => b.ageGroup ?? ''))]
  keys.sort((a, b) => (AGE_ORDER.indexOf(a) === -1 ? 99 : AGE_ORDER.indexOf(a)) - (AGE_ORDER.indexOf(b) === -1 ? 99 : AGE_ORDER.indexOf(b)))
  return keys.map((key) => ({ key, items: items.filter((b) => (b.ageGroup ?? '') === key) }))
}

const stallColumns = () => (typeof window === 'undefined' ? 4 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2)

function useStallColumns() {
  const [cols, setCols] = useState(stallColumns)
  useEffect(() => {
    const onResize = () => setCols(stallColumns())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return cols
}

function BookStall({ items, categoryId, onOpen }: { items: Book[]; categoryId: string; onOpen: (book: Book, language?: string) => void }) {
  const lang = useLang()
  const t = textsFor(lang)
  const cols = useStallColumns()
  const scene = sceneFor(categoryId)
  const rows: Book[][] = []
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols))

  return (
    <div className="grid gap-8">
      {rows.map((row, rowIndex) => (
        <Reveal key={row[0].id} delay={rowIndex * 80}>
          <div
            className="stall-block"
            style={{ '--cols': cols, '--scene': `url(${scene.src})`, '--base': scene.base, '--x0': scene.x0, '--x1': scene.x1 } as CSSProperties}
          >
            <div className="stall">
              <div className="stall-slots">
                {row.map((b) => {
                  const cardBook = localizedBook(b, lang)
                  const cover = coverFor(cardBook)
                  return (
                    <div className="stall-slot" key={b.id}>
                      <button type="button" onClick={() => onOpen(b)} className="stall-cover group" aria-label={`${t.books.lookInside}: ${b.title}`}>
                        {isNew(b) ? (
                          <span className="absolute -top-2 left-0 z-10 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold leading-none text-accent-foreground shadow sm:text-xs">{t.books.newBadge}</span>
                        ) : null}
                        {cover.spread ? (
                          <span className="stall-cover-spread block"><BookCover book={cardBook} variant="card" /></span>
                        ) : (
                          <img src={cover.src} alt={cardBook.title} loading="lazy" draggable={false} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="stall-info">
              {row.map((b) => {
                const cardBook = localizedBook(b, lang)
                const { main, sub } = splitTitle(cardBook)
                return (
                  <article key={b.id} className="flex flex-col items-center text-center">
                    {volumeLabel(cardBook) ? <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{volumeLabel(cardBook)}</p> : null}
                    <h3 className="book-card-title font-display text-base font-semibold leading-tight sm:mt-1 sm:text-[1.05rem] lg:text-[1.1rem]" style={{ WebkitLineClamp: 3 }}>
                      <a
                        href={bookPath(b)}
                        onClick={(event) => {
                          // normaler Klick öffnet das Fenster; Strg/Mittelklick öffnet die eigene Buchseite
                          if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return
                          event.preventDefault()
                          onOpen(b)
                        }}
                        className="hover:underline"
                      >
                        {main}
                      </a>
                    </h3>
                    {sub ? <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{sub}</p> : null}
                    {cardBook.detail ? <p className="mt-1.5 text-xs font-semibold text-muted-foreground">{cardBook.detail}</p> : null}
                    <LanguageEditions book={b} compact label="" onSelect={(language) => onOpen(b, language)} />
                    <div className="flex justify-center"><AmazonRating book={b} /></div>
                    <button
                      type="button"
                      onClick={() => (hasFlipbook(b.id) ? openFlipBookById(b.id) : onOpen(b))}
                      className="mt-3 flex min-h-11 w-full max-w-[220px] items-center justify-center gap-2 rounded-full bg-primary px-2 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:text-sm"
                    >
                      {hasFlipbook(b.id) ? <BookOpen className="h-4 w-4" aria-hidden /> : null}
                      {hasFlipbook(b.id) ? t.books.flipInside : t.books.lookInside}
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

function BookStalls({ items, categoryId, onOpen }: { items: Book[]; categoryId: string; onOpen: (book: Book, language?: string) => void }) {
  const lang = useLang()
  const parts = splitByAge(items)
  // Altersüberschriften nur, wenn die Buchart mehrere Altersgruppen enthält
  const showAge = parts.filter((part) => AGE_GROUPS[part.key]).length > 1
  return (
    <div className="grid gap-12">
      {parts.map((part) => {
        const age = AGE_GROUPS[part.key]
        return (
          <div key={part.key || 'alle'}>
            {showAge && age ? (
              <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[#e6dcc3] pb-3 shadow-[0_10px_12px_-12px_rgba(21,49,103,0.35)]">
                <span className="rounded-full px-3.5 py-1 text-sm font-extrabold text-white shadow" style={{ backgroundColor: age.color }}>{age[lang][0]}</span>
                <h3 className="font-display text-2xl font-semibold">{age[lang][1]}</h3>
              </div>
            ) : null}
            <BookStall items={part.items} categoryId={categoryId} onOpen={onOpen} />
          </div>
        )
      })}
    </div>
  )
}

export default function Books() {
  const lang = useLang()
  const t = textsFor(lang)

  // Deep-Link beim ersten Laden direkt als Startzustand lesen (?buch=david).
  // Ungültige IDs werden ignoriert – die Seite bleibt benutzbar.
  const [active, setActive] = useState<Book | null>(() => BOOKS.find((b) => b.id === bookIdFromLocation()) ?? null)
  const [activeEdition, setActiveEdition] = useState<string | null>(() => {
    const found = BOOKS.find((b) => b.id === bookIdFromLocation())
    if (!found) return null
    const editions = editionsOf(found)
    return editions.find((item) => item.language === lang)?.language
      ?? editions.find((item) => item.language === found.lang)?.language
      ?? editions[0]?.language
      ?? null
  })
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

  // Gruppen je Kategorie (nur Kategorien mit Büchern); unbekannte Kategorien landen unter „Weitere"
  const groups = [
    ...CATEGORIES.map((c) => ({ id: c.id, label: catLabelOf(c.id, lang), color: c.color, items: books.filter((b) => b.category === c.id) })),
    { id: 'weitere', label: lang === 'en' ? 'More' : 'Weitere', color: '#64748b', items: books.filter((b) => !catDefOf(b.category)) },
  ]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length)

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

        {/* Kategorien als auf- und zuklappbare Bereiche (Kategorien kommen aus dem Admin) */}
        {groups.length > 0 ? (
          <div className="mt-10 grid gap-14">
            {groups.map((group, gi) => (
              <Reveal key={group.id} delay={gi * 80}>
                <details open={gi === 0} className="group/cat">
                  <summary className="flex cursor-pointer list-none items-end gap-4 border-b border-[#d9cdb0] pb-4 shadow-[0_12px_14px_-12px_rgba(21,49,103,0.35)] [&::-webkit-details-marker]:hidden">
                    <span className="block">
                      <span className="block font-display text-3xl font-semibold leading-none sm:text-4xl" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.9), 0 6px 14px rgba(21,49,103,0.16)' }}>{group.label}</span>
                      <span className="mt-3 block h-1 w-14 rounded-full bg-accent shadow-[0_3px_6px_-1px_rgba(180,130,10,0.55)]" aria-hidden />
                    </span>
                    <span className="mb-1 flex-1 text-sm font-semibold text-muted-foreground">
                      {group.items.length} {group.items.length === 1 ? t.books.titleOne : t.books.titleMany}
                    </span>
                    <span className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#d9cdb0] bg-background text-primary shadow-[0_6px_12px_-6px_rgba(21,49,103,0.45)] transition-transform duration-300 group-open/cat:rotate-180" aria-hidden>
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </summary>
                  <div className="pb-4 pt-8">
                    {group.id === 'malbuecher' && group.items.some(isColoringBook) ? <ColoringBookFacts /> : null}
                    <div className="mt-6"><BookStalls items={group.items} categoryId={group.id} onOpen={openBook} /></div>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-10">
            <div className="mx-auto max-w-lg rounded-2xl border border-accent/35 bg-gradient-to-b from-accent/10 to-accent/5 px-8 py-14 text-center shadow-sm">
              <p className="font-display text-2xl font-semibold">{t.books.emptyAll}</p>
            </div>
          </Reveal>
        )}

        {lang === 'de' && COMING_SOON.length > 0 && (
          <p className="mt-8 text-center text-sm font-semibold text-muted-foreground">
            <span className="font-bold text-foreground">{t.books.growing}</span> {COMING_SOON.join(' · ')}
          </p>
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
