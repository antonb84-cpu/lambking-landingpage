import { ExternalLink } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const t = textsFor(useLang())
  const hasStoreLink = SITE.playStoreUrl.startsWith('https://')

  return (
    <section id="app" className="scroll-mt-28 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div className="mx-auto w-[60%] overflow-hidden rounded-2xl border border-border shadow-xl shadow-primary/10">
            <img
              src="images/app-willkommen.jpg"
              alt={t.app.title}
              className="w-full"
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
            {/* Google Play: aktiver Button nur mit echter Store-URL, sonst Hinweis */}
            {hasStoreLink ? (
              <a
                href={SITE.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.04]"
                aria-label={t.app.playAlt}
              >
                <img
                  src="images/buttons/google-play.png"
                  alt={t.app.playAlt}
                  className="h-14 w-auto sm:h-16"
                />
              </a>
            ) : (
              <div>
                <img
                  src="images/buttons/google-play.png"
                  alt=""
                  aria-hidden
                  className="h-14 w-auto opacity-60 grayscale sm:h-16"
                />
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  {t.app.playSoon}
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
