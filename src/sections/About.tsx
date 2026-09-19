import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
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
    <section id="ueber" className="scroll-mt-28 border-y border-border bg-card/70 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="grid items-center gap-9 md:grid-cols-[260px_1fr] lg:gap-14">
          <div className="text-center md:text-left">
            <div className="mx-auto w-fit rounded-[2rem] border border-accent/25 bg-background p-4 shadow-[0_18px_45px_-30px_rgba(21,49,103,0.45)] md:mx-0">
              <img
                src={SITE.authorPhoto}
                alt={SITE.authorName}
                className={`border-2 border-accent/35 object-cover ${shape} ${size}`}
                loading="lazy"
              />
            </div>
            <p className="mt-4 font-display text-xl font-semibold">{SITE.authorName}</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-muted-foreground">{t.about.role}</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.about.eyebrow}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.about.title}
            </h2>
            <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
            {t.about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}><RichText text={p} /></p>
            ))}
              <blockquote className="border-l-4 border-accent bg-background px-5 py-4 font-display text-lg font-semibold leading-relaxed text-foreground shadow-sm">
                <RichText text={t.about.highlight} />
              </blockquote>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
