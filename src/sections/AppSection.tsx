import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const t = textsFor(useLang())
  const hasStoreLink = !!SITE.playStoreUrl

  return (
    <section id="app" className="scroll-mt-28 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div className="mx-auto w-[60%] overflow-hidden rounded-2xl border border-border shadow-xl shadow-primary/10">
            <img
              src="/images/app-willkommen.jpg"
              alt="Willkommensbild der LambKing App"
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
          {hasStoreLink ? (
            <a
              href={SITE.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block transition-transform hover:scale-[1.04]"
              aria-label="LambKing App bei Google Play herunterladen"
            >
              <img
                src="/images/buttons/google-play.png"
                alt="Jetzt bei Google Play"
                className="h-14 w-auto sm:h-16"
              />
            </a>
          ) : (
            <div className="mt-7">
              <img
                src="/images/buttons/google-play.png"
                alt="Bald bei Google Play"
                className="h-14 w-auto opacity-60 grayscale sm:h-16"
              />
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                {t.app.soon}
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}
