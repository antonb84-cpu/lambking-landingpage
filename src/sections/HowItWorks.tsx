import { Eye, MousePointerClick, Truck } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const STEP_ICONS = [Eye, MousePointerClick, Truck]

export default function HowItWorks() {
  const t = textsFor(useLang())
  return (
    <section id="so-funktionierts" className="scroll-mt-24 border-y-2 border-border bg-card/60 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.how.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.how.title}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <Reveal key={s.title} delay={i * 120}>
                <div className="group relative h-full overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="pointer-events-none absolute -right-3 -top-6 font-display text-8xl font-bold text-accent/10 transition-colors group-hover:text-accent/20">
                    {i + 1}
                  </span>
                  <div className="mb-4 inline-flex rounded-full bg-gradient-to-br from-accent to-accent/75 p-3.5 text-white shadow-md shadow-accent/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
