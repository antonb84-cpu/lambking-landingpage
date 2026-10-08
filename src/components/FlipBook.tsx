import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Maximize2, Pause, Play } from 'lucide-react'
import BuyButton from '@/components/BuyButton'
import type { Book } from '@/data/books'
import { coverFor } from '@/data/covers'
import { flipBackFor, flipLanguagesFor, flipPagesFor, flipRatioFor, flipTotalFor } from '@/data/flipbooks'
import { useLang } from '@/data/lang'
import { LANGUAGE_META } from '@/data/languageMeta'
import { textsFor } from '@/data/texts'

// Durchblätterbares Softcover-Vorschaubuch (Leseprobe). Am Computer blättert es als aufgeschlagenes Buch mit zwei
// Seiten, am Handy zeigt es immer eine Seite zum Wischen. Es zeigt nur einen Teil des Buches (siehe flipbooks.json:
// count von total); am Ende steht eine Hinweisseite mit dem Weg zu Amazon, danach die Rückseite.
const FLIP_MS = 950
const STEP_MS = 1250
const PAPER = '#fdfbf4'
const END = '@ende' // Marker für die Hinweisseite am Ende der Leseprobe
const NARROW_PX = 560 // schmaler als das → eine Seite statt aufgeschlagenem Buch

type Item = string // Bildadresse oder END
type Leaf = { front?: Item; back?: Item; cover?: boolean }
type Single = { kind: 'cover' | 'page' | 'end' | 'back'; src?: string; page?: number }

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, String(value)), text)

function PreviewEnd({ count, total, compact }: { count: number; total: number; compact?: boolean }) {
  const t = textsFor(useLang()).tryit
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3cqw] px-[9%] text-center" style={{ color: '#1c2a4a' }}>
      <span className={compact ? 'text-[11cqw] leading-none' : 'text-[5.5cqw] leading-none'} aria-hidden>🐑</span>
      <p className={`font-display font-semibold leading-tight ${compact ? 'text-[8cqw]' : 'text-[4cqw]'}`}>{t.previewEndTitle}</p>
      <p className={`leading-snug opacity-80 ${compact ? 'text-[5cqw]' : 'text-[2.4cqw]'}`}>{fill(t.previewEndText, { count, total })}</p>
    </div>
  )
}

function Face({ item, side, spread, alt, count, total }: { item?: Item; side: 'front' | 'back'; spread?: boolean; alt: string; count: number; total: number }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: side === 'back' ? 'rotateY(180deg)' : undefined,
        background: PAPER,
      }}
    >
      {item === END ? (
        <PreviewEnd count={count} total={total} />
      ) : item ? (
        spread ? (
          <img src={item} alt={alt} draggable={false} className="absolute right-0 top-0 h-full w-auto max-w-none select-none" />
        ) : (
          <img src={item} alt={alt} draggable={false} className="h-full w-full select-none object-cover" />
        )
      ) : null}
      {/* weicher Schatten am Falz, damit die Seiten gebunden wirken */}
      <div
        className={`pointer-events-none absolute inset-y-0 w-[14%] ${side === 'front' ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-black/[0.14] via-black/[0.03] to-transparent`}
        aria-hidden
      />
    </div>
  )
}

export default function FlipBook({ book, size = 'section', onFullscreen }: { book: Book; size?: 'section' | 'dialog'; onFullscreen?: () => void }) {
  const lang = useLang()
  const t = textsFor(lang).tryit
  // Sprachen mit Blätterbuch: je Flagge eine eigene Fassung (Seiten, Cover, Rückseite)
  const flipLangs = useMemo(() => flipLanguagesFor(book.id), [book.id])
  // Startsprache = Seitensprache (DE/EN oben), sonst die Sprache des Buches. Wechselt die Seitensprache,
  // wird das Buch von der Seite neu aufgebaut (key im Elternelement) und folgt so der Sprache.
  const [sel, setSel] = useState<string>(() =>
    flipLangs.includes(lang) ? lang : flipLangs.includes(book.lang) ? book.lang : flipLangs[0] ?? book.lang,
  )
  const edition = useMemo(() => book.editions.find((item) => item.language === sel), [book, sel])
  const { src: cover, spread: coverSpread } = coverFor(book, edition)
  const pages = useMemo(() => flipPagesFor(book.id, sel) ?? (edition?.samples?.length ? edition.samples : book.samples), [book, sel, edition])
  const count = pages.length
  const total = flipTotalFor(book.id, sel) ?? count
  const pageRatio = flipRatioFor(book.id, sel) // Breite / Höhe einer Seite
  const backCover = useMemo(() => flipBackFor(book.id, sel), [book.id, sel])
  // Wird nur ein Teil des Buches gezeigt, steht am Ende eine Hinweisseite
  // (Bei gerader Seitenzahl steht eine leere Seite davor, damit die Hinweisseite links liegt.)
  const items = useMemo<Item[]>(() => (total > count ? [...pages, ...(count % 2 === 0 ? [''] : []), END] : pages), [pages, total, count])
  const leaves = useMemo<Leaf[]>(() => {
    const list: Leaf[] = [{ front: cover, cover: true }]
    for (let i = 0; i < items.length; i += 2) list.push({ front: items[i], back: items[i + 1] })
    // Rückseite als letztes Blatt: innen leer, außen das Rückseiten-Cover
    if (backCover) list.push({ back: backCover, cover: true })
    return list
  }, [cover, items, backCover])
  const L = leaves.length
  const lastPageLeaf = backCover ? L - 1 : L // Zustand, in dem links die letzte Buchseite liegt
  const singles = useMemo<Single[]>(() => [
    { kind: 'cover', src: cover },
    ...pages.map((src, index): Single => ({ kind: 'page', src, page: index + 1 })),
    ...(total > count ? [{ kind: 'end' } as Single] : []),
    ...(backCover ? [{ kind: 'back', src: backCover } as Single] : []),
  ], [cover, pages, backCover, total, count])

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const [f, setF] = useState(0) // so viele Blätter sind umgeschlagen (aufgeschlagenes Buch)
  const [idx, setIdx] = useState(0) // aktuelle Seite (Einzelseiten-Ansicht am Handy)
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const [playing, setPlaying] = useState(false)
  const [inView, setInView] = useState(false)
  const [moving, setMoving] = useState<number | null>(null)
  const [instant, setInstant] = useState(false)
  const [fading, setFading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const moveTimer = useRef<number>(0)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    // Breite des umgebenden Bereichs messen (nicht die des Buches selbst, die bei schmaler Ansicht begrenzt wird)
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW_PX))
    ro.observe(el.parentElement ?? el)
    return () => {
      io.disconnect()
      ro.disconnect()
    }
  }, [])

  const fRef = useRef(0)
  const go = (dir: 1 | -1) => {
      const current = fRef.current
      const next = Math.min(L, Math.max(0, current + dir))
      if (next === current) return
      fRef.current = next
      setF(next)
      setMoving(dir === 1 ? current : current - 1)
      window.clearTimeout(moveTimer.current)
      moveTimer.current = window.setTimeout(() => setMoving(null), FLIP_MS)
  }

  // Selbstablauf nur auf Wunsch (Play-Knopf): Blatt für Blatt bis zum Ende, dann von vorn.
  useEffect(() => {
    if (narrow || !playing || !inView || reduced) return
    const delay = f === 0 ? 1800 : f >= L ? 3400 : STEP_MS
    const id = window.setTimeout(() => {
      if (f < L) {
        go(1)
        return
      }
      setFading(true)
      window.setTimeout(() => {
        setInstant(true)
        fRef.current = 0
        setF(0)
        setMoving(null)
        window.setTimeout(() => {
          setInstant(false)
          setFading(false)
        }, 60)
      }, 550)
    }, delay)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go liest nur Ref und Setter, ändert sich inhaltlich nicht
  }, [f, narrow, playing, inView, reduced, L])

  // Nächste Seiten vorladen (nur die, die als Nächstes gebraucht werden)
  useEffect(() => {
    if (narrow) {
      for (let i = idx; i <= idx + 3 && i < singles.length; i++) {
        const src = singles[i]?.src
        if (src) new Image().src = src
      }
      return
    }
    for (let i = f; i <= f + 4 && i < L; i++) {
      for (const src of [leaves[i]?.front, leaves[i]?.back]) {
        if (src && src !== END) new Image().src = src
      }
    }
  }, [narrow, idx, singles, f, L, leaves])

  // Seitenanzeige. Aufgeschlagen: nach dem Titelblatt liegt links die gerade, rechts die ungerade Seite
  const pageText = (first: number, second?: number) => {
    if (first > count) return t.previewEnd
    if (second === undefined || second > count) return `${t.page} ${first} ${t.of} ${total}`
    return `${t.pages} ${first}–${second} ${t.of} ${total}`
  }
  const leftPage = (f - 1) * 2
  const shownSpread =
    f === 0
      ? t.cover
      : backCover && f >= L
        ? t.backCover
        : f === 1
          ? pageText(1)
          : f >= lastPageLeaf
            ? pageText(leftPage)
            : pageText(leftPage, leftPage + 1)
  const current = singles[Math.min(idx, singles.length - 1)]
  const shownSingle =
    current.kind === 'cover' ? t.cover : current.kind === 'back' ? t.backCover : current.kind === 'end' ? t.previewEnd : pageText(current.page ?? 1)
  const shown = narrow ? shownSingle : shownSpread
  const atStart = narrow ? idx === 0 : f === 0
  const atEnd = narrow ? idx >= singles.length - 1 : f >= L

  // Mit einem Klick zur Titelseite oder zum Ende (Überblendung statt Durchblättern)
  const jumpTo = (target: 'start' | 'end') => {
    setPlaying(false)
    if (narrow) {
      setIdx(target === 'start' ? 0 : singles.length - 1)
      return
    }
    const to = target === 'start' ? 0 : L
    if (fRef.current === to) return
    setFading(true)
    window.setTimeout(() => {
      setInstant(true)
      fRef.current = to
      setF(to)
      setMoving(null)
      window.setTimeout(() => {
        setInstant(false)
        setFading(false)
      }, 60)
    }, 380)
  }

  // Flagge angeklickt: das Buch erscheint in dieser Sprache (Seiten, Titelseite, Rückseite), von vorn
  const switchLang = (code: string) => {
      if (code === sel) return
      setPlaying(false)
      setFading(true)
      window.setTimeout(() => {
        setInstant(true)
        fRef.current = 0
        setF(0)
        setIdx(0)
        setMoving(null)
        setSel(code)
        window.setTimeout(() => {
          setInstant(false)
          setFading(false)
        }, 60)
      }, 380)
  }

  const manual = (dir: 1 | -1) => {
    setPlaying(false)
    if (narrow) {
      setIdx((value) => Math.min(singles.length - 1, Math.max(0, value + dir)))
      return
    }
    go(dir)
  }

  // Wischen am Handy
  const onPointerDown = (event: ReactPointerEvent) => {
    swipe.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: ReactPointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) manual(dx < 0 ? 1 : -1)
  }

  const shift = f === 0 ? '-25%' : f >= L ? '25%' : '0%'
  const thickRight = Math.min(7, Math.ceil((L - f) / 5))
  const thickLeft = Math.min(7, Math.ceil(f / 5))
  const dialog = size === 'dialog'
  const maxWidth = dialog ? `min(100%, 1080px, calc((100svh - 300px) * ${pageRatio * 2}))` : 'min(100%, 960px)'
  const altOf = (item?: Item, side?: 'front' | 'back', leafIndex?: number) => {
    if (!item || item === END) return ''
    if (item === cover || item === backCover) return `${book.title} – ${item === cover ? t.cover : t.backCover}`
    const page = leafIndex !== undefined && side ? (leafIndex - 1) * 2 + (side === 'front' ? 1 : 2) : 0
    return page > 0 ? `${book.title} – ${t.page} ${page}` : book.title
  }

  return (
    <div ref={rootRef} className="mx-auto w-full" style={{ maxWidth: narrow ? '420px' : maxWidth }} role="group" aria-label={book.title}>
      {narrow ? (
        <div
          className="relative mx-auto w-full select-none overflow-hidden rounded-[4px] bg-[#fdfbf4] shadow-xl shadow-black/25"
          style={{ aspectRatio: `${pageRatio}`, containerType: 'inline-size', touchAction: 'pan-y' }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {current.kind === 'end' ? (
            <PreviewEnd count={count} total={total} compact />
          ) : current.src ? (
            current.kind === 'cover' && coverSpread ? (
              <img src={current.src} alt={altOf(cover)} draggable={false} className="absolute right-0 top-0 h-full w-auto max-w-none select-none" />
            ) : (
              <img
                key={current.src}
                src={current.src}
                alt={current.kind === 'page' ? `${book.title} – ${t.page} ${current.page}` : altOf(current.src)}
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
            )
          ) : null}
          <button type="button" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => manual(-1)} aria-label={t.prev} tabIndex={-1} />
          <button type="button" className="absolute inset-y-0 right-0 z-10 w-2/3" onClick={() => manual(1)} aria-label={t.next} tabIndex={-1} />
        </div>
      ) : (
        <>
          <div
            className="relative w-full select-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:-rotate-1 [@media(hover:hover)]:hover:scale-[1.025]"
            style={{ aspectRatio: `${pageRatio * 2}`, perspective: '2600px', containerType: 'inline-size', opacity: fading ? 0 : 1, transition: 'opacity 500ms ease, transform 300ms ease' }}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `translateX(${shift})`, transition: instant ? 'none' : `transform ${FLIP_MS}ms cubic-bezier(.4,.1,.2,1)` }}
            >
              {/* Seitenstapel: sichtbare Papierkanten, die beim Blättern wandern */}
              <div
                className="absolute right-0 top-[1.2%] h-[97.6%] rounded-r-[3px]"
                style={{ width: `calc(50% + ${thickRight}px)`, background: `repeating-linear-gradient(90deg, #efe8d3 0 1px, #fbf7ea 1px 2px)`, transition: 'width 400ms, opacity 400ms', opacity: f >= L ? 0 : 1 }}
                aria-hidden
              />
              <div
                className="absolute left-0 top-[1.2%] h-[97.6%] rounded-l-[3px]"
                style={{ width: `calc(50% + ${thickLeft}px)`, background: `repeating-linear-gradient(90deg, #fbf7ea 0 1px, #efe8d3 1px 2px)`, transition: 'width 400ms', opacity: f === 0 ? 0 : 1 }}
                aria-hidden
              />
              {leaves.map((leaf, i) => {
                if (i < f - 2 || i > f + 3) return null
                const flipped = i < f
                const z = moving === i ? 200 : flipped ? 10 + i : 10 + (L - i)
                return (
                  <div
                    key={i}
                    className="absolute left-1/2 top-0 h-full w-1/2"
                    style={{
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      transform: `rotateY(${flipped ? -180 : 0}deg)`,
                      transition: instant ? 'none' : `transform ${FLIP_MS}ms cubic-bezier(.45,.05,.25,1)`,
                      zIndex: z,
                    }}
                  >
                    <div
                      className={moving === i ? 'flip-curl' : ''}
                      style={{
                        transformStyle: 'preserve-3d',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: leaf.cover ? '2px 6px 6px 2px' : '1px',
                        boxShadow: moving === i ? '0 10px 26px rgba(40,30,10,0.28)' : leaf.cover ? '0 6px 16px rgba(40,30,10,0.22)' : undefined,
                      }}
                    >
                      <Face item={leaf.front} side="front" spread={leaf.cover ? coverSpread : false} alt={altOf(leaf.front, 'front', i)} count={count} total={total} />
                      <Face item={leaf.back} side="back" alt={altOf(leaf.back, 'back', i)} count={count} total={total} />
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Klick links/rechts blättert von Hand */}
            <button type="button" className="absolute inset-y-0 left-0 z-[300] w-1/2 cursor-w-resize" onClick={() => manual(-1)} aria-label={t.prev} tabIndex={-1} />
            <button type="button" className="absolute inset-y-0 right-0 z-[300] w-1/2 cursor-e-resize" onClick={() => manual(1)} aria-label={t.next} tabIndex={-1} />
          </div>
          <div className="mx-auto mt-3 h-3 w-3/4 rounded-[50%] bg-black/15 blur-md" aria-hidden />
        </>
      )}
      <div className={dialog ? 'mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3' : ''}>
      {flipLangs.length > 1 ? (
        <div className={`mx-auto flex items-center justify-center gap-2 ${dialog ? 'sm:mx-0' : 'mt-4'}`} role="group" aria-label={t.bookLanguage}>
          {flipLangs.map((code) => {
            const meta = LANGUAGE_META[code]
            const name = meta ? meta[lang] : code.toUpperCase()
            const active = code === sel
            return (
              <button
                type="button"
                key={code}
                onClick={() => switchLang(code)}
                aria-pressed={active}
                aria-label={name}
                title={name}
                className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1 shadow-sm transition before:absolute before:-inset-1.5 before:content-[''] hover:scale-110 ${
                  active ? 'border-accent ring-2 ring-accent/50' : 'border-primary/20 opacity-75 hover:opacity-100'
                }`}
              >
                {meta ? (
                  <img src={meta.flag} alt="" className="h-full w-full rounded-full object-cover" aria-hidden draggable={false} />
                ) : (
                  <span className="text-sm leading-none" aria-hidden>🌐</span>
                )}
              </button>
            )
          })}
        </div>
      ) : null}
      <div className={`mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full ${dialog ? 'sm:mx-0' : 'mt-4'}  border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur sm:gap-2`}>
        <button type="button" onClick={() => jumpTo('start')} disabled={atStart} aria-label={t.first} title={t.first} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronsLeft className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => manual(-1)} disabled={atStart} aria-label={t.prev} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        {narrow ? null : (
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? t.pause : t.play} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90">
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <button type="button" onClick={() => manual(1)} disabled={atEnd} aria-label={t.next} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => jumpTo('end')} disabled={atEnd} aria-label={t.last} title={t.last} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronsRight className="h-5 w-5" aria-hidden />
        </button>
        <span className="w-full text-center text-xs font-bold uppercase tracking-wider text-muted-foreground sm:ml-2 sm:w-auto sm:min-w-[8.5rem] sm:text-left" aria-live="polite">{shown}</span>
      </div>
      <div className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${dialog ? '' : 'mt-4'}`}>
        <BuyButton book={book} preferredLanguage={sel} />
        {onFullscreen ? (
          <button
            type="button"
            onClick={onFullscreen}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-card px-5 py-2 text-sm font-bold text-primary transition-colors hover:border-primary/50"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            {t.fullscreen}
          </button>
        ) : null}
      </div>
      </div>
    </div>
  )
}
