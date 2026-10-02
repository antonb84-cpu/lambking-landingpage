import LoopVideo from '@/components/LoopVideo'
import Reveal from '@/components/Reveal'
import Freebie from '@/sections/Freebie'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// „So malen Kinder mit LambKing": Standbilder (Video lädt erst beim Antippen), darunter das kostenlose
// Ausmalbild. Videos und Ausmalbild werden im Admin gepflegt und können einzeln ausgeblendet werden.
export default function Family() {
  const k = textsFor(useLang()).kids
  const showVideos = !SITE.hiddenSections.includes('kids') && SITE.kidsVideos.length > 0
  const showFreebie = !SITE.hiddenSections.includes('freebie')
  if (!showVideos && !showFreebie) return null

  return (
    <section id="kinder" className="scroll-mt-28 pb-0 pt-12 lg:pt-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {showVideos ? (
          <>
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{k.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{k.text}</p>
            </Reveal>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {SITE.kidsVideos.map((clip, i) => (
                <Reveal key={clip.src} delay={i * 80}>
                  <div className="relative overflow-hidden rounded-2xl border-2 border-card shadow-md shadow-primary/10">
                    <LoopVideo
                      manual
                      src={clip.src}
                      poster={clip.poster}
                      label={k.title}
                      className="aspect-[9/16] w-full object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        {showFreebie ? (
          <div className={showVideos ? 'mt-14 lg:mt-20' : ''}>
            <Freebie embedded />
          </div>
        ) : null}
      </div>
    </section>
  )
}
