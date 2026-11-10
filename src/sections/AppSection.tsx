import PhoneCarousel from '@/components/PhoneCarousel'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import StoreBadges from '@/components/StoreBadges'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function AppSection() {
  const t = textsFor(useLang())

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
          <StoreBadges className="justify-center" />
        </Reveal>
      </div>
    </section>
  )
}
