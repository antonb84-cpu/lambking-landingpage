import { BookOpen, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Reveal from '@/components/Reveal'
import { BOOKS, isNew } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { openBookById } from '@/data/openBook'

const TRUST_ICONS = [ShieldCheck, Sparkles, BookOpen]

// ── Blätter-Physik ────────────────────────────────────────────
// Jede Seite ist eine weiche Feder: Sie bewegt sich aus ihrer
// aktuellen Position Richtung Ziel – nie ein Sprung, nie ein
// Neustart. Deshalb wiederholen sich Seiten auch bei schnellem
// Rein/Raus mit der Maus nicht. Die Wölbung entsteht aus dem
// Blätterwinkel (sinusförmig, in der Mitte am stärksten).
const OPEN_ANGLE = -172 // Zielwinkel einer umgeblätterten Seite
const OPEN_DELAY = 420  // ms Staffelung pro Seite beim Öffnen
const CLOSE_DELAY = 260 // ms Staffelung pro Seite beim Schließen
const OPEN_RATE = 3.1   // Feder-Geschwindigkeit Öffnen (weich)
const CLOSE_RATE = 4.2  // Feder-Geschwindigkeit Schließen
// Höhenstaffelung: Die Grundseite liegt bei BASE_Z, jedes Blatt
// darüber – sonst deckt die Grundseite die letzten Blätter ab
// und ihr Bild erscheint mehrfach beim Durchblättern.
const BASE_Z = 10
const LEAF_STEP = 0.6

function Book3D() {
  const lang = useLang()
  // Im Backend kann genau ein Buch pro Sprache für die Vorschau markiert
  // werden. Ohne Auswahl bleibt das bisherige Verhalten erhalten.
  const langBooks = BOOKS.filter((b) => b.lang === lang)
  const pool = langBooks.length > 0 ? langBooks : BOOKS
  const featured = pool.find((book) => book.showInHero) ?? pool.find(isNew) ?? pool[0]
  const previewPages = featured.samples.slice(0, 10)
  // Umschlag + alle Vorschauseiten außer der letzten als Blätter;
  // die letzte Seite bleibt als Grundseite liegen
  const leaves = [featured.cover, ...previewPages.slice(0, -1)]
  const basePage = previewPages[previewPages.length - 1] ?? featured.cover
  const count = leaves.length

  const leafEls = useRef<(HTMLDivElement | null)[]>([])
  const kickRef = useRef<(hovering: boolean) => void>(() => {})
  const sim = useRef({
    angles: [] as number[],   // aktueller Winkel pro Blatt
    hovering: false,
    stateSince: 0,            // Zeitpunkt des letzten Hover-Wechsels
    raf: 0,
    last: 0,
  })

  useEffect(() => {
    const s = sim.current
    s.angles = Array(count).fill(0)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const paint = () => {
      for (let i = 0; i < count; i++) {
        const el = leafEls.current[i]
        if (!el) continue
        const t = Math.min(1, Math.abs(s.angles[i]) / Math.abs(OPEN_ANGLE))
        const bow = Math.sin(t * Math.PI) * 4.5
        const lift = Math.sin(t * Math.PI) * 10
        const z = BASE_Z + (count - i) * LEAF_STEP + lift
        el.style.transform = `translateZ(${z}px) rotateY(${s.angles[i]}deg) skewY(${bow}deg)`
        // Vorder-/Rückseite hart umschalten (robuster als reine
        // backface-visibility, die bei vielen 3D-Ebenen aussetzen kann)
        const showFront = Math.abs(s.angles[i]) <= 90
        const front = el.children[0] as HTMLElement | undefined
        const back = el.children[1] as HTMLElement | undefined
        if (front) front.style.visibility = showFront ? 'visible' : 'hidden'
        if (back) back.style.visibility = showFront ? 'hidden' : 'visible'
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - s.last) / 1000) // Sekunden, gedeckelt
      s.last = now
      let busy = false
      for (let i = 0; i < count; i++) {
        const delay = s.hovering ? i * OPEN_DELAY : (count - 1 - i) * CLOSE_DELAY
        const released = now - s.stateSince >= delay
        const angle = s.angles[i]
        // Vor Freigabe: Blatt ruht an seiner aktuellen Position
        const target = released ? (s.hovering ? OPEN_ANGLE : 0) : angle
        const rate = s.hovering ? OPEN_RATE : CLOSE_RATE
        const next = angle + (target - angle) * (1 - Math.exp(-dt * rate))
        s.angles[i] = Math.abs(target - next) < 0.02 ? target : next
        if (s.angles[i] !== target || !released) busy = true
      }
      paint()
      if (busy) {
        s.raf = requestAnimationFrame(tick)
      } else {
        s.raf = 0
      }
    }

    const start = () => {
      s.last = performance.now()
      if (!s.raf) s.raf = requestAnimationFrame(tick)
    }
    kickRef.current = (hovering: boolean) => {
      if (s.hovering === hovering) return
      s.hovering = hovering
      s.stateSince = performance.now()
      if (reducedMotion) {
        // Ohne Bewegung: Seiten direkt umlegen
        s.angles = s.angles.map(() => (hovering ? OPEN_ANGLE : 0))
        paint()
        return
      }
      start()
    }
    return () => cancelAnimationFrame(s.raf)
  }, [count])

  return (
    <button
      type="button"
      onClick={() => openBookById(featured.id)}
      aria-label={`${featured.title} – ${textsFor(lang).books.lookInside}`}
      className="book3d-scene relative mx-auto block w-60 cursor-pointer sm:w-72 lg:w-80"
      onMouseEnter={() => kickRef.current(true)}
      onMouseLeave={() => kickRef.current(false)}
      onFocus={() => kickRef.current(true)}
      onBlur={() => kickRef.current(false)}
    >
      <div className="book3d-float">
        <div className="book3d">
          <div className="book3d-back" />
          <div className="book3d-spine" />
          <div className="book3d-pages" />
          {/* Grundseite: letzte Vorschauseite, bleibt beim Blättern liegen */}
          <img
            src={basePage}
            alt={`Seite aus ${featured.title}`}
            className="book3d-page-base"
            loading="eager"
            fetchPriority="high"
          />
          {/* Blätter: Umschlag zuerst, dann Seite für Seite */}
          {leaves.map((src, i) => (
            <div
              key={src + i}
              ref={(el) => {
                leafEls.current[i] = el
              }}
              className="book3d-leaf"
              style={{ transform: `translateZ(${BASE_Z + (count - i) * LEAF_STEP}px)` }}
            >
              <img
                src={src}
                alt={i === 0 ? featured.title : `Vorschauseite ${i} aus ${featured.title}`}
                className="book3d-leaf-front"
                loading="eager"
              />
              <div className="book3d-leaf-back" />
            </div>
          ))}
          <div className="book3d-shadow" />
        </div>
      </div>
      <span className="mt-12 block text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="hidden sm:inline">{textsFor(lang).hero.bookHint}</span>
        <span className="sm:hidden">
          {lang === 'de' ? 'Antippen, um das Buch anzusehen' : 'Tap to look inside'}
        </span>
      </span>
    </button>
  )
}

export default function Hero() {
  const t = textsFor(useLang())
  return (
    <section id="top" className="texture-paper overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-16">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold leading-[1.16] tracking-tight sm:text-5xl">
            <span className="lg:block">{t.hero.title1}</span>{' '}
            <span className="italic text-accent lg:block">{t.hero.title2}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#buecher"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              <BookOpen className="h-5 w-5" aria-hidden />
              {t.hero.ctaBooks}
            </a>
            <a
              href="#app"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/25 bg-card px-7 py-3 font-bold text-primary transition-colors hover:border-primary/50"
            >
              <Smartphone className="h-5 w-5" aria-hidden />
              {t.hero.ctaApp}
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {t.hero.trust.map((label, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <div key={label} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Icon className="h-4 w-4 text-accent" aria-hidden />
                  {label}
                </div>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={150} className="py-6">
          <Book3D />
        </Reveal>
      </div>
    </section>
  )
}
