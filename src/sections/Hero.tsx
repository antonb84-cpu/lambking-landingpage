import type { CSSProperties } from 'react'
import { BookOpen, Star } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import StoreBadges from '@/components/StoreBadges'
import { BOOKS, SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

// Echte Amazon-Bewertungen über alle sichtbaren Bücher (gewichteter Durchschnitt) – nie erfunden.
function amazonSummary(): { rating: number; count: number } | null {
  if (!SITE.showRatings) return null
  const rated = BOOKS.filter((book) => typeof book.amazonRating === 'number' && (book.amazonRatingCount ?? 0) > 0)
  const count = rated.reduce((sum, book) => sum + (book.amazonRatingCount ?? 0), 0)
  if (!count) return null
  const rating = rated.reduce((sum, book) => sum + (book.amazonRating ?? 0) * (book.amazonRatingCount ?? 0), 0) / count
  return { rating, count }
}

// Titelbereich als Shop-Banner: links Überschrift und Knöpfe auf ruhigem Grund, rechts das Titelbild.
// So liegt kein Text mehr über dem Bild, und die Bücher beginnen kurz darunter.
// Der Bildausschnitt kommt weiter aus dem Admin (Reiter „Startseite & Medien“).
export default function Hero() {
  const lang = useLang()
  const t = textsFor(lang)
  const summary = amazonSummary()
  const locale = lang === 'de' ? 'de-DE' : 'en-US'
  const h = SITE.hero
  const imageStyle = {
    '--hero-pos-m': `${clamp(h.focusMobile.x, 0, 100)}% ${clamp(h.focusMobile.y, 0, 100)}%`,
    '--hero-pos-d': `${clamp(h.focusDesktop.x, 0, 100)}% ${clamp(h.focusDesktop.y, 0, 100)}%`,
  } as CSSProperties

  return (
    <section id="top" className="bg-background">
      <div className="mx-auto max-w-7xl sm:px-6 sm:pt-5">
        <div className="grid overflow-hidden bg-[#fffdf8] sm:rounded-3xl sm:border sm:border-[#e6dcc3] sm:shadow-[0_18px_30px_-24px_rgba(21,49,103,0.55)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="relative aspect-[16/9] lg:order-last lg:aspect-auto lg:min-h-[400px]">
            <picture>
              <source media="(min-width: 768px)" srcSet="images/hero-titel.webp" type="image/webp" />
              <source media="(min-width: 768px)" srcSet="images/hero-titel.jpg" />
              <source srcSet="images/hero-titel-mobil.webp" type="image/webp" />
              <img
                src="images/hero-titel-mobil.jpg"
                alt={t.hero.videoAlt}
                fetchPriority="high"
                decoding="async"
                style={imageStyle}
                className="absolute inset-0 h-full w-full object-cover object-[var(--hero-pos-m)] lg:object-[var(--hero-pos-d)]"
              />
            </picture>
          </div>

          <Reveal className="flex flex-col justify-center px-4 py-7 sm:px-8 lg:py-9 lg:pl-10 lg:pr-8">
            <h1 className="font-display text-3xl font-semibold leading-[1.14] tracking-tight sm:text-4xl xl:text-[2.6rem]">
              <span className="lg:block">{t.hero.title1}</span>{' '}
              <span className="italic text-accent lg:block">{t.hero.title2}</span>
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-foreground/80">
              <RichText text={t.hero.subtitle} />
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#buecher"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
              >
                <BookOpen className="h-5 w-5" aria-hidden />
                {t.hero.ctaBooks}
              </a>
            </div>
            {!SITE.hiddenSections.includes('app') ? <StoreBadges onlyLinks className="mt-4" /> : null}
            {summary ? (
              <a href="#buecher" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <span className="flex items-center gap-0.5 text-accent" aria-hidden>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} className="h-4 w-4" fill={value <= Math.round(summary.rating) ? 'currentColor' : 'none'} />
                  ))}
                </span>
                <span>
                  {t.hero.ratingLine
                    .replace('{rating}', summary.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
                    .replace('{count}', summary.count.toLocaleString(locale))}
                </span>
              </a>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
