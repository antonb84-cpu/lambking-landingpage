import FlipBook from '@/components/FlipBook'
import Freebie from '@/sections/Freebie'
import Reveal from '@/components/Reveal'
import { pickFeatured } from '@/data/featured'
import { useLang } from '@/data/lang'
import { openBookById } from '@/data/openBook'
import { textsFor } from '@/data/texts'

// „Blick ins Buch": das Softcover blättert einmal vollständig durch
// und darunter das kostenlose Ausmalbild (Freebie).
export default function TryIt() {
  const lang = useLang()
  const t = textsFor(lang).tryit
  const featured = pickFeatured(lang)
  return (
    <section id="ausprobieren" className="scroll-mt-28 texture-paper py-14 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal>
            <FlipBook book={featured} />
          </Reveal>
          <Reveal delay={100}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.eyebrow}</p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.text}</p>
            <button
              type="button"
              onClick={() => openBookById(featured.id)}
              className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-primary/25 bg-card px-6 py-3 font-bold text-primary transition-colors hover:border-primary/50"
            >
              {t.lookInside}
            </button>
          </Reveal>
        </div>
        <div className="mt-12">
          <Freebie embedded />
        </div>
      </div>
    </section>
  )
}
