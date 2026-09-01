import { Frown, HeartHandshake, Smile } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const ICONS = ['images/icons/bibeltreu.png', '', 'images/icons/werbefrei.png']

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
              {i === 1 ? (
                <span
                  className="mx-auto mb-4 flex h-12 w-16 items-center justify-center"
                  aria-label={t.trust.childrenIconLabel}
                  role="img"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-sm">
                    <Frown className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent shadow-sm">
                    <Smile className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                  </span>
                </span>
              ) : (
                <img
                  src={ICONS[i]}
                  alt=""
                  aria-hidden
                  className="mx-auto mb-4 h-12 w-auto"
                  loading="lazy"
                />
              )}
              <h3 className="font-bold">{it.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
