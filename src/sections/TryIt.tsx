import { Check } from 'lucide-react'
import FlipBook from '@/components/FlipBook'
import Reveal from '@/components/Reveal'
import { pickFeatured } from '@/data/featured'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// „Blick ins Buch": das Softcover zum Durchblättern, bewusst groß, auf einer warmen Bühne
// mit den wichtigsten Merkmalen als ruhige Checkliste daneben.
export default function TryIt() {
  const lang = useLang()
  const texts = textsFor(lang)
  const t = texts.tryit
  const facts = texts.books.coloringFacts.slice(0, 4)
  const featured = pickFeatured()
  if (!featured) return null // alle Bücher ausgeblendet
  return (
    <section id="ausprobieren" className="scroll-mt-28 texture-paper relative overflow-hidden py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-12">
          <Reveal className="relative">
            {/* warmer Lichtschein hinter dem Buch */}
            <div
              className="pointer-events-none absolute left-1/2 top-[44%] -z-0 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
              style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.22), hsl(var(--accent) / 0.08) 55%, transparent 100%)' }}
              aria-hidden
            />
            <div className="relative z-10">
              <FlipBook key={`${featured.id}-${lang}`} book={featured} />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {t.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.text}</p>
            <ul className="mt-6 space-y-2.5">
              {facts.map((fact) => (
                <li key={fact} className="flex items-center gap-3 text-sm font-semibold text-foreground sm:text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
