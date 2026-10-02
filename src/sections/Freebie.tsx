import { Download, Sparkles } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Kostenloses Ausmalbild (PDF) als eigener, auffälliger Abschnitt.
export default function Freebie({ embedded = false }: { embedded?: boolean }) {
  const f = textsFor(useLang()).freebie
  const card = (
      <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-5 shadow-sm sm:p-6">
            <div className="grid items-center gap-5 sm:grid-cols-[130px_1fr]">
              <div className="relative mx-auto w-28 sm:w-full">
                <span className="absolute -right-2 -top-2 z-10 flex h-9 w-9 rotate-12 items-center justify-center rounded-full bg-accent/90 text-[9px] font-extrabold uppercase tracking-wide text-accent-foreground shadow">
                  {f.badge}
                </span>
                <img
                  src={SITE.freebie.preview}
                  alt={f.title}
                  loading="lazy"
                  className="w-full -rotate-2 rounded-sm border border-border bg-white shadow-md transition-transform duration-300 hover:rotate-0"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {f.eyebrow}
                </p>
                <h3 className="font-display text-xl font-semibold leading-tight sm:text-2xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                <a
                  href={SITE.freebie.pdf}
                  download
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-background px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary/50"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {f.download}
                </a>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{f.hint}</p>
              </div>
            </div>
          </div>
      </Reveal>
  )
  if (embedded) return <div id="gratis" className="scroll-mt-28">{card}</div>
  return (
    <section id="gratis" className="scroll-mt-28 py-10 lg:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {card}
      </div>
    </section>
  )
}
