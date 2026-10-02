import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/data/lang'
import { SITE } from '@/data/books'

// Wisch-Karussell mit Handy-Rahmen: nativer Scroll-Snap (Wischen am Handy, Trackpad/Maus am Desktop),
// dazu Pfeile, Punkte und Tastatur (←/→). Das mittlere Handy ist das aktive.
export default function PhoneCarousel() {
  const lang = useLang()
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const APP_SCREENS = SITE.appScreens
  const L = APP_SCREENS.length
  const label = lang === 'en' ? { prev: 'Previous screen', next: 'Next screen', go: 'Show screen', group: 'App screenshots' } : { prev: 'Vorheriger Screen', next: 'Nächster Screen', go: 'Screen anzeigen', group: 'App-Screenshots' }

  const slideEls = () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>('[data-slide]') ?? [])

  const goTo = useCallback((i: number) => {
    const els = slideEls()
    const el = els[Math.max(0, Math.min(L - 1, i))]
    const track = trackRef.current
    if (!el || !track) return
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior: 'smooth' })
  }, [L])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2
        let best = 0
        let dist = Infinity
        slideEls().forEach((el, i) => {
          const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - center)
          if (d < dist) { dist = d; best = i }
        })
        setActive(best)
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => { track.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const cur = APP_SCREENS[active]
  const copy = cur[lang === 'en' ? 'en' : 'de']

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label.group}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1) }
      }}
      className="relative rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-110px)] pb-6 pt-2 [--w:220px] [scrollbar-width:none] sm:gap-7 sm:px-[calc(50%-130px)] sm:[--w:260px] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {APP_SCREENS.map((s, i) => (
          <figure
            key={s.src}
            data-slide
            onClick={() => i !== active && goTo(i)}
            className={`w-[var(--w)] shrink-0 snap-center transition-all duration-300 ${i === active ? 'scale-100 opacity-100' : 'scale-[0.88] cursor-pointer opacity-70'}`}
          >
            <div className="rounded-[2.2rem] border-[7px] border-[#16213f] bg-[#16213f] shadow-2xl shadow-primary/25">
              <img
                src={s.src}
                alt={`${s[lang === 'en' ? 'en' : 'de'].title}`}
                loading="lazy"
                draggable={false}
                className="aspect-[600/1162] w-full rounded-[1.7rem] object-cover"
              />
            </div>
          </figure>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(active - 1)}
        disabled={active === 0}
        aria-label={label.prev}
        className="absolute left-1 top-[42%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-md transition hover:border-primary/50 disabled:opacity-30 md:flex"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
        disabled={active === L - 1}
        aria-label={label.next}
        className="absolute right-1 top-[42%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-md transition hover:border-primary/50 disabled:opacity-30 md:flex"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <div className="mx-auto mt-1 max-w-sm px-4 text-center" aria-live="polite">
        <p className="font-display text-lg font-semibold">{copy.title}</p>
        <p className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground">{copy.text}</p>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1">
        {APP_SCREENS.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${label.go} ${i + 1}`}
            aria-current={i === active}
            className="flex h-8 w-6 items-center justify-center"
          >
            <span className={`block h-2.5 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : 'w-2.5 bg-primary/25'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
