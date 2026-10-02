import PhoneCarousel from '@/components/PhoneCarousel'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const t = textsFor(useLang())
  const hasPlayStoreLink = SITE.playStoreUrl.startsWith('https://')
  const hasAppStoreLink = SITE.iosStoreUrl.startsWith('https://')

  const playBadge = (
    <span className="relative block h-14 w-[168px] overflow-hidden rounded-[9px] sm:h-16 sm:w-48">
      <img
        src="images/buttons/google-play.png"
        alt={t.app.playAlt}
        className="absolute left-1/2 top-1/2 h-[70px] max-w-none -translate-x-1/2 -translate-y-1/2 sm:h-20"
      />
    </span>
  )

  const appStoreBadge = (
    <span className="flex h-14 w-[168px] items-center justify-center sm:h-16 sm:w-48">
      <img src="images/buttons/app-store.svg" alt={t.app.appStoreAlt} className="h-14 w-auto sm:h-16" />
    </span>
  )

  return (
    <section id="app" className="scroll-mt-28 overflow-hidden bg-gradient-to-b from-primary/[0.07] via-primary/[0.04] to-transparent py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.app.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.app.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <RichText text={t.app.text} />
          </p>
        </Reveal>
      </div>

      <Reveal delay={100} className="mx-auto mt-8 max-w-[1500px]">
        <PhoneCarousel />
      </Reveal>

      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
        <Reveal delay={150}>
          <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5">
            {hasPlayStoreLink ? (
              <a
                href={SITE.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.04]"
                aria-label={t.app.playAlt}
              >
                {playBadge}
              </a>
            ) : (
              <div className="w-[168px] sm:w-48">
                {playBadge}
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.app.playSoon}</p>
              </div>
            )}
            {hasAppStoreLink ? (
              <a
                href={SITE.iosStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.04]"
                aria-label={t.app.appStoreAlt}
              >
                {appStoreBadge}
              </a>
            ) : (
              <div className="w-[168px] sm:w-48" aria-disabled="true">
                <span className="block opacity-45 grayscale">{appStoreBadge}</span>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.app.appStoreSoon}</p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
