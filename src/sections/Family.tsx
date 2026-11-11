import LoopVideo from '@/components/LoopVideo'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// „So malen Kinder mit LambKing": Standbilder (Video lädt erst beim Antippen). Die Videos werden im Admin
// gepflegt und können ausgeblendet werden. Das kostenlose Ausmalbild ist in der Shop-Fassung entfallen.
export default function Family() {
  const k = textsFor(useLang()).kids
  const showVideos = !SITE.hiddenSections.includes('kids') && SITE.kidsVideos.length > 0
  if (!showVideos) return null

  return (
    <section id="kinder" className="scroll-mt-28 py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
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
      </div>
    </section>
  )
}
