import PhoneCarousel from '@/components/PhoneCarousel'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { isMiddleClick, trackLinkClick } from '@/data/analytics'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const t = textsFor(useLang())
  const hasPlayStoreLink = SITE.playStoreUrl.startsWith('https://')
  const hasAppStoreLink = SITE.iosStoreUrl.startsWith('https://')

  const playBadge = (
    <span className="relative block h-11 w-[132px] overflow-hidden rounded-[7px] sm:h-12 sm:w-36">
      <img
        src="images/buttons/google-play.png"
        alt={t.app.playAlt}
        className="absolute left-1/2 top-1/2 h-[55px] max-w-none -translate-x-1/2 -translate-y-1/2 sm:h-[60px]"
      />
    </span>
  )

  const appStoreBadge = (
    <span className="flex h-11 w-[132px] items-center justify-center sm:h-12 sm:w-36">
      <img src="images/buttons/app-store.svg" alt={t.app.appStoreAlt} className="h-11 w-auto sm:h-12" />
    </span>
  )

  return (
    <section id="app" className="scroll-mt-28 overflow-hidden bg-gradient-to-b from-primary/[0.05] via-primary/[0.03] to-transparent py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{t.app.eyebrow}</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t.app.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <RichText text={t.app.text} />
          </p>
        </Reveal>
      </div>

      <Reveal delay={100} className="mx-auto mt-5 max-w-[1100px]">
        <PhoneCarousel />
      </Reveal>

      <div className="mx-auto mt-4 max-w-5xl px-4 sm:px-6">
        <Reveal delay={150}>
          <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
            {hasPlayStoreLink ? (
              <a
                href={SITE.playStoreUrl}
                onClick={() => trackLinkClick('playstore')}
                onAuxClick={(event) => isMiddleClick(event) && trackLinkClick('playstore')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.04]"
                aria-label={t.app.playAlt}
              >
                {playBadge}
              </a>
            ) : (
              <div className="w-[132px] sm:w-36">
                {playBadge}
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.app.playSoon}</p>
              </div>
            )}
            {hasAppStoreLink ? (
              <a
                href={SITE.iosStoreUrl}
                onClick={() => trackLinkClick('appstore')}
                onAuxClick={(event) => isMiddleClick(event) && trackLinkClick('appstore')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.04]"
                aria-label={t.app.appStoreAlt}
              >
                {appStoreBadge}
              </a>
            ) : (
              <div className="w-[132px] sm:w-36" aria-disabled="true">
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
