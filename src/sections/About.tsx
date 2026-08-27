import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const SHAPES = {
  rund: 'rounded-full',
  abgerundet: 'rounded-2xl',
  eckig: 'rounded-none',
} as const

const SIZES = {
  klein: 'h-20 w-20',
  mittel: 'h-32 w-32',
  gross: 'h-44 w-44',
} as const

export default function About() {
  const t = textsFor(useLang())
  const shape = SHAPES[SITE.authorPhotoShape] ?? SHAPES.rund
  const size = SIZES[SITE.authorPhotoSize] ?? SIZES.klein

  return (
    <section id="ueber" className="scroll-mt-28 border-y border-border bg-card/60 py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.about.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.about.title}
          </h2>

          <img
            src={SITE.authorPhoto}
            alt={SITE.authorName}
            className={`mx-auto mt-8 border-2 border-accent/40 object-cover shadow-sm ${shape} ${size}`}
            loading="lazy"
          />
          <p className="mt-3 text-sm font-bold">{SITE.authorName}</p>
          <p className="text-xs font-semibold text-muted-foreground">{t.about.role}</p>

          <div className="mt-7 space-y-4 leading-relaxed text-muted-foreground">
            {t.about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <p className="font-semibold text-foreground">{t.about.highlight}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
