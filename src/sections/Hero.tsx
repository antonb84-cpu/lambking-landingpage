import type { CSSProperties } from 'react'
import { BookOpen, HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Titelbild-Einstellungen kommen aus dem Admin (Reiter „Startseite & Medien“):
// Schriftfarbe auf dem Bild, Stärke der Abdunklung links und der Bildausschnitt.
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

export default function Hero() {
  const lang = useLang()
  const t = textsFor(lang)
  const h = SITE.hero
  const light = h.textTone === 'light'
  const scrim = clamp(h.scrim, 0, 100) / 100
  const imageStyle = {
    '--hero-pos-m': `${clamp(h.focusMobile.x, 0, 100)}% ${clamp(h.focusMobile.y, 0, 100)}%`,
    '--hero-pos-d': `${clamp(h.focusDesktop.x, 0, 100)}% ${clamp(h.focusDesktop.y, 0, 100)}%`,
  } as CSSProperties
  // Abdunklung links: dunkle Schrift → helle Fläche, helle Schrift → dunkelblaue Fläche
  const tint = light ? 'var(--primary)' : 'var(--background)'
  const stop = (factor: number) => `hsl(${tint} / ${(scrim * factor).toFixed(3)})`
  const gradient = `linear-gradient(90deg, ${stop(1)} 0%, ${stop(0.775)} 26%, ${stop(0.25)} 44%, ${stop(0)} 58%)`

  return (
    <section id="top" className="relative overflow-hidden bg-background">
      {/* Titelbild: mobil oben, ab xl als Hintergrund hinter dem Text */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/8] xl:absolute xl:inset-0 xl:aspect-auto">
        <picture>
          <source media="(min-width: 1280px)" srcSet="images/hero-titel-breit.webp" type="image/webp" />
          <source media="(min-width: 1280px)" srcSet="images/hero-titel-breit.jpg" />
          <source media="(min-width: 768px)" srcSet="images/hero-titel.webp" type="image/webp" />
          <source media="(min-width: 768px)" srcSet="images/hero-titel.jpg" />
          <source srcSet="images/hero-titel-mobil.webp" type="image/webp" />
          <img
            src="images/hero-titel-mobil.jpg"
            alt={t.hero.videoAlt}
            fetchPriority="high"
            decoding="async"
            style={imageStyle}
            className="h-full w-full object-cover object-[var(--hero-pos-m)] xl:absolute xl:inset-0 xl:object-[var(--hero-pos-d)]"
          />
        </picture>
        <div className="pointer-events-none absolute inset-0 hidden xl:block" style={{ background: gradient }} />
      </div>

      <div className="relative mx-auto flex max-w-6xl px-4 pb-10 pt-8 sm:px-6 xl:min-h-[max(700px,min(54vw,800px))] xl:items-start xl:pb-24 xl:pt-14">
        <Reveal className="max-w-[32rem]">
          <h1 className={`font-display text-4xl font-semibold leading-[1.14] tracking-tight sm:text-5xl xl:text-[3.1rem] ${light ? 'xl:text-white' : ''}`}>
            <span className="xl:block">{t.hero.title1}</span>{' '}
            <span className="italic text-accent xl:block">{t.hero.title2}</span>
          </h1>
          <p className={`mt-5 text-base font-medium leading-relaxed sm:text-lg ${light ? 'text-foreground/80 xl:text-white/90' : 'text-foreground/80'}`}>
            <RichText text={t.hero.subtitle} />
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#buecher"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              <BookOpen className="h-5 w-5" aria-hidden />
              {t.hero.ctaBooks}
            </a>
            <a
              href="#unterstuetzen"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
            >
              <HandHeart className="h-5 w-5" aria-hidden />
              {t.hero.ctaSupport}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
