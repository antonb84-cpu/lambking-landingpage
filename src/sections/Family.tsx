import LoopVideo from '@/components/LoopVideo'
import Reveal from '@/components/Reveal'
import Freebie from '@/sections/Freebie'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Eigene Videos der Familie: public/videos/kids/<name>.mp4 + .jpg (Standbild)
const CLIPS = ['ausmalen-meer', 'buch-durchblaettern', 'ausmalen-schildkroete', 'ausmalen-buntstifte']

// „So malen Kinder mit LambKing": vier Standbilder der Töchter (Video lädt erst beim Antippen),
// darunter das kostenlose Ausmalbild.
export default function Family() {
  const k = textsFor(useLang()).kids

  return (
    <section id="kinder" className="scroll-mt-28 pb-0 pt-12 lg:pt-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{k.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{k.text}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CLIPS.map((clip, i) => (
            <Reveal key={clip} delay={i * 80}>
              <div className="relative overflow-hidden rounded-2xl border-2 border-card shadow-md shadow-primary/10">
                <LoopVideo
                  manual
                  src={`videos/kids/${clip}.mp4`}
                  poster={`videos/kids/${clip}.jpg`}
                  label={k.title}
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 lg:mt-20">
          <Freebie embedded />
        </div>
      </div>
    </section>
  )
}
