import { ArrowRight, Handshake } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { useLang } from '@/data/lang'
import { creatorPartnerHref } from '@/data/routes'
import { textsFor } from '@/data/texts'

// Schlanker blauer Balken mit gleichmäßigem Abstand nach oben und unten.
export default function CreatorPartnerTeaser() {
  const cp = textsFor(useLang()).creatorPartner

  return (
    <section id="creator-partner" className="py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-primary/85 px-6 py-7 text-center text-primary-foreground shadow-xl shadow-primary/20 sm:flex-row sm:gap-6 sm:px-9 sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-black/20">
              <Handshake className="h-7 w-7" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold leading-snug sm:text-2xl">{cp.heroTitle}</h2>
              <p className="mt-1.5 text-sm text-primary-foreground/80 sm:text-base">{cp.microCreatorNote}</p>
            </div>
            <a
              href={creatorPartnerHref()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-lg shadow-black/20 transition-transform hover:scale-[1.03]"
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
