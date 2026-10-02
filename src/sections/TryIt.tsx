import FlipBook from '@/components/FlipBook'
import Reveal from '@/components/Reveal'
import { pickFeatured } from '@/data/featured'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// „Blick ins Buch": das Softcover zum Durchblättern, bewusst groß.
export default function TryIt() {
  const lang = useLang()
  const t = textsFor(lang).tryit
  const featured = pickFeatured(lang)
  return (
    <section id="ausprobieren" className="scroll-mt-28 texture-paper py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-12">
          <Reveal>
            <FlipBook book={featured} />
          </Reveal>
          <Reveal delay={100}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.eyebrow}</p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.text}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
