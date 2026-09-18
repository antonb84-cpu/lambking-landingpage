import { ArrowRight, Handshake, Sparkles } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { useLang } from '@/data/lang'
import { creatorPartnerHref } from '@/data/routes'
import { textsFor } from '@/data/texts'

export default function CreatorPartnerTeaser() {
  const cp = textsFor(useLang()).creatorPartner

  return (
    <section id="creator-partner" className="border-b border-accent/20 bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-accent/25 bg-primary px-6 py-10 text-primary-foreground shadow-xl sm:px-10 lg:px-14 lg:py-12">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-background/10 blur-3xl" aria-hidden />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
                  <Handshake className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {cp.heroTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
                  <RichText text={cp.heroText} />
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {cp.microCreatorNote}
                </p>
              </div>
              <a
                href={creatorPartnerHref()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-primary"
              >
                {cp.applyNow}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
