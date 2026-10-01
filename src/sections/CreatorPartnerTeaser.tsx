import { ArrowRight, Handshake } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { creatorPartnerHref } from '@/data/routes'
import { textsFor } from '@/data/texts'

// Bewusst schlank: eine ruhige Zeile statt eines großen farbigen Kastens,
// damit der Spendenbereich der einzige laute Block bleibt.
export default function CreatorPartnerTeaser() {
  const cp = textsFor(useLang()).creatorPartner

  return (
    <section id="creator-partner" className="pb-12 lg:pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/70 px-5 py-5 text-center shadow-sm sm:flex-row sm:text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Handshake className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold leading-snug sm:text-xl">{cp.heroTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{cp.microCreatorNote}</p>
            </div>
            <a
              href={creatorPartnerHref()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-background px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary/50"
            >
              {cp.applyNow}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
