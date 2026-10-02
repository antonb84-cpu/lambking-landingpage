import { ArrowRight, Handshake } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { creatorPartnerHref } from '@/data/routes'
import { textsFor } from '@/data/texts'

// Blauer Balken: Der Abstand nach oben ist so groß wie der bis „Häufige Fragen"
// (der obere Innenabstand der FAQ-Sektion bildet den unteren Abstand).
export default function CreatorPartnerTeaser() {
  const cp = textsFor(useLang()).creatorPartner

  return (
    <section id="creator-partner" className="pb-0 pt-16 lg:pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-primary to-primary/85 px-6 py-9 sm:py-11 text-center text-primary-foreground shadow-xl shadow-primary/20 sm:flex-row sm:gap-8 sm:px-12 sm:text-left">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-black/20">
              <Handshake className="h-8 w-8" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold leading-snug sm:text-3xl">{cp.heroTitle}</h2>
              <p className="mt-2 text-base text-primary-foreground/80 sm:text-lg">{cp.microCreatorNote}</p>
            </div>
            <a
              href={creatorPartnerHref()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-bold text-accent-foreground shadow-lg shadow-black/20 transition-transform hover:scale-[1.03]"
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
