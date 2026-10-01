import { Crown, Heart, ScrollText } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const ICONS = [Heart, Crown, ScrollText]

// „Über LambKing": Vision und Autor in einem kompakten Block, darunter in einer ruhigen Zeile
// die Erklärung des Namens (Lamb, King und die Bibelstelle, in der beides vorkommt).
export default function Mascot() {
  const t = textsFor(useLang())
  const m = t.mascot
  const a = t.about
  return (
    <section id="vision" className="scroll-mt-28 border-y border-border/70 bg-card/50 py-12 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="grid items-center gap-6 md:grid-cols-[150px_1fr] md:gap-10">
          <div id="ueber" className="scroll-mt-28 text-center">
            <img
              src={SITE.authorPhoto}
              alt={SITE.authorName}
              loading="lazy"
              className="mx-auto h-28 w-28 rounded-full border-2 border-accent/35 object-cover md:h-32 md:w-32"
            />
            <p className="mt-3 font-display text-lg font-semibold leading-tight">{SITE.authorName}</p>
            <p className="mt-0.5 text-xs font-semibold leading-snug text-muted-foreground">{a.role}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">{m.eyebrow}</p>
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{a.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <RichText text={m.lead} />
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <RichText text={a.paragraphs[0] ?? ''} />
            </p>
            <blockquote className="mt-4 border-l-4 border-accent pl-4 font-display text-base font-semibold leading-relaxed text-foreground">
              <RichText text={a.highlight} />
            </blockquote>
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-8">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{m.nameTitle}</p>
          <ul className="grid gap-2.5 md:grid-cols-3">
            {m.items.map((item, i) => {
              const Icon = ICONS[i] ?? ScrollText
              return (
                <li key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3 shadow-sm">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <p className={`mt-0.5 text-xs leading-snug text-muted-foreground ${i === 2 ? 'italic' : ''}`}>
                      <RichText text={item.text} />
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
