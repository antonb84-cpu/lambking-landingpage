import { HeartHandshake } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const ICONS = ['images/icons/bibeltreu.png', 'images/icons/kindgerecht.png', 'images/icons/werbefrei.png']

export default function Trust() {
  const t = textsFor(useLang())
  return (
    <section className="border-t border-border bg-card/50 py-14 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.trust.title}
          </h2>
          <div className="mx-auto mt-4 flex w-56 items-center gap-3">
            <span className="h-px flex-1 bg-accent/50" />
            <HeartHandshake className="h-4 w-4 text-accent" />
            <span className="h-px flex-1 bg-accent/50" />
          </div>
        </Reveal>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {t.trust.items.map((it, i) => (
            <Reveal key={it.title} delay={i * 120} className="text-center">
              <img
                src={ICONS[i]}
                alt=""
                aria-hidden
                className="mx-auto mb-4 h-12 w-auto"
                loading="lazy"
              />
              <h3 className="font-bold">{it.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
