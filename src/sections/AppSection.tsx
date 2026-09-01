import { ExternalLink } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const lang = useLang()
  const t = textsFor(lang)
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
    <section id="app" className="scroll-mt-28 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div className="mx-auto aspect-[760/1647] w-[60%] overflow-hidden rounded-2xl border border-border shadow-xl shadow-primary/10">
            <img
              src={lang === 'en' ? 'images/app-welcome-en.jpg' : 'images/app-willkommen.jpg'}
              alt={t.app.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.app.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.app.title}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t.app.text}
          </p>
          <div className="mt-7 flex flex-col items-start gap-3">
            {/* Primär: die Web-App (echter externer Link aus den Einstellungen) */}
            {SITE.appUrl.startsWith('https://') && (
              <a
                href={SITE.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
              >
                <ExternalLink className="h-5 w-5" aria-hidden />
                {t.app.ctaWebApp}
              </a>
            )}
            <div className="flex flex-wrap items-start gap-3">
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
          </div>
        </Reveal>
      </div>
    </section>
  )
}
