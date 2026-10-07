import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play } from 'lucide-react'
import type { Book } from '@/data/books'
import { coverFor } from '@/data/covers'
import { flipBackFor, flipLanguagesFor, flipPagesFor } from '@/data/flipbooks'
import { useLang } from '@/data/lang'
import { LANGUAGE_META } from '@/data/languageMeta'
import { textsFor } from '@/data/texts'

// Durchblätterbares Softcover-Vorschaubuch: zeigt das Buch einmal vollständig
// von der Titelseite bis zur letzten Seite. Hat das Buch noch kein vollständiges
// Blätterbuch (siehe flipbooks.json), blättert es durch Cover + Vorschauseiten.
const PAGE_RATIO = 621 / 810 // Breite / Höhe einer Seite
const FLIP_MS = 950
const STEP_MS = 1250
const PAPER = '#fdfbf4'

type Leaf = { front?: string; back?: string; cover?: boolean }

function Face({ src, side, spread }: { src?: string; side: 'front' | 'back'; spread?: boolean }) {
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
      {src ? (
        spread ? (
          <img src={src} alt="" draggable={false} className="absolute right-0 top-0 h-full w-auto max-w-none select-none" />
        ) : (
          <img src={src} alt="" draggable={false} className="h-full w-full select-none object-cover" />
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

export default function FlipBook({ book }: { book: Book }) {
  const lang = useLang()
  const t = textsFor(lang).tryit
  // Sprachen mit vollständigem Blätterbuch: je Flagge eine eigene Fassung (Seiten, Cover, Rückseite)
  const flipLangs = useMemo(() => flipLanguagesFor(book.id), [book.id])
  // Startsprache = Seitensprache (DE/EN oben), sonst die Sprache des Buches. Wechselt die Seitensprache,
  // wird das Buch von der Seite neu aufgebaut (key in TryIt) und folgt so der Sprache.
  const [sel, setSel] = useState<string>(() =>
    flipLangs.includes(lang) ? lang : flipLangs.includes(book.lang) ? book.lang : flipLangs[0] ?? book.lang,
  )
  const edition = useMemo(() => book.editions.find((item) => item.language === sel), [book, sel])
  const { src: cover, spread: coverSpread } = coverFor(book, edition)
  const pages = useMemo(() => flipPagesFor(book.id, sel) ?? (edition?.samples?.length ? edition.samples : book.samples), [book, sel, edition])
  const backCover = useMemo(() => flipBackFor(book.id, sel), [book.id, sel])
  const leaves = useMemo<Leaf[]>(() => {
    const list: Leaf[] = [{ front: cover, cover: true }]
    for (let i = 0; i < pages.length; i += 2) list.push({ front: pages[i], back: pages[i + 1] })
    // Rückseite als letztes Blatt: innen leer, außen das Rückseiten-Cover
    if (backCover) list.push({ back: backCover, cover: true })
    return list
  }, [cover, pages, backCover])
  const L = leaves.length
  const lastPageLeaf = backCover ? L - 1 : L // Zustand, in dem links die letzte Buchseite liegt

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const [f, setF] = useState(0) // so viele Blätter sind umgeschlagen
  const [playing, setPlaying] = useState(false)
  const [inView, setInView] = useState(false)
  const [moving, setMoving] = useState<number | null>(null)
  const [instant, setInstant] = useState(false)
  const [fading, setFading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const moveTimer = useRef<number>(0)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const fRef = useRef(0)
  const go = useCallback(
    (dir: 1 | -1) => {
      const current = fRef.current
      const next = Math.min(L, Math.max(0, current + dir))
      if (next === current) return
      fRef.current = next
      setF(next)
      setMoving(dir === 1 ? current : current - 1)
      window.clearTimeout(moveTimer.current)
      moveTimer.current = window.setTimeout(() => setMoving(null), FLIP_MS)
    },
    [L],
  )

  // Selbstablauf nur auf Wunsch (Play-Knopf): Blatt für Blatt bis zum Ende, dann von vorn.
  useEffect(() => {
    if (!playing || !inView || reduced) return
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
  }, [f, playing, inView, reduced, L, go])

  // Nächste Seiten vorladen
  useEffect(() => {
    for (let i = f; i <= f + 4 && i < L; i++) {
      for (const src of [leaves[i]?.front, leaves[i]?.back]) {
        if (src) new Image().src = src
      }
    }
  }, [f, L, leaves])

  // Seitenanzeige: nach dem Titelblatt liegt links die gerade, rechts die ungerade Seite
  const leftPage = (f - 1) * 2
  const n = pages.length
  const shown =
    f === 0
      ? t.cover
      : backCover && f >= L
        ? t.backCover
        : f === 1
          ? `${t.page} 1 ${t.of} ${n}`
          : f >= lastPageLeaf
            ? `${t.page} ${n} ${t.of} ${n}`
            : `${t.pages} ${leftPage}–${leftPage + 1} ${t.of} ${n}`

  // Mit einem Klick zur Titelseite oder zur Rückseite (Überblendung statt Durchblättern)
  const jumpTo = (target: number) => {
    setPlaying(false)
    if (fRef.current === target) return
    setFading(true)
    window.setTimeout(() => {
      setInstant(true)
      fRef.current = target
      setF(target)
      setMoving(null)
      window.setTimeout(() => {
        setInstant(false)
        setFading(false)
      }, 60)
    }, 380)
  }

  // Flagge angeklickt: das Buch erscheint in dieser Sprache (Seiten, Titelseite, Rückseite), von vorn
  const switchLang = useCallback(
    (code: string) => {
      if (code === sel) return
      setPlaying(false)
      setFading(true)
      window.setTimeout(() => {
        setInstant(true)
        fRef.current = 0
        setF(0)
        setMoving(null)
        setSel(code)
        window.setTimeout(() => {
          setInstant(false)
          setFading(false)
        }, 60)
      }, 380)
    },
    [sel],
  )

  const manual = (dir: 1 | -1) => {
    setPlaying(false)
    go(dir)
  }

  const shift = f === 0 ? '-25%' : f >= L ? '25%' : '0%'
  const thickRight = Math.min(7, Math.ceil((L - f) / 5))
  const thickLeft = Math.min(7, Math.ceil(f / 5))

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[680px]" role="group" aria-label={book.title}>
      <div
        className="relative w-full select-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:-rotate-1 [@media(hover:hover)]:hover:scale-[1.025]"
        style={{ aspectRatio: `${PAGE_RATIO * 2}`, perspective: '2600px', opacity: fading ? 0 : 1, transition: 'opacity 500ms ease, transform 300ms ease' }}
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
                  <Face src={leaf.front} side="front" spread={leaf.cover ? coverSpread : false} />
                  <Face src={leaf.back} side="back" />
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
      {flipLangs.length > 1 ? (
        <div className="mx-auto mt-4 flex items-center justify-center gap-2" role="group" aria-label={t.bookLanguage}>
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
      <div className="mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur sm:gap-2">
        <button type="button" onClick={() => jumpTo(0)} disabled={f === 0} aria-label={t.first} title={t.first} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronsLeft className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => manual(-1)} disabled={f === 0} aria-label={t.prev} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? t.pause : t.play} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90">
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
        <button type="button" onClick={() => manual(1)} disabled={f >= L} aria-label={t.next} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => jumpTo(L)} disabled={f >= L} aria-label={t.last} title={t.last} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-35">
          <ChevronsRight className="h-5 w-5" aria-hidden />
        </button>
        <span className="w-full text-center sm:ml-2 sm:w-auto sm:min-w-[8.5rem] sm:text-left text-xs font-bold uppercase tracking-wider text-muted-foreground" aria-live="polite">{shown}</span>
      </div>
    </div>
  )
}
