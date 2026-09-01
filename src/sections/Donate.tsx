import { HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import KofiButton from '@/components/KofiButton'
import PaypalButton from '@/components/PaypalButton'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function Donate() {
  const lang = useLang()
  const t = textsFor(lang)
  if (!SITE.paypalUrl && !SITE.kofiUrl) return null

  return (
    <section id="unterstuetzen" className="scroll-mt-28 pb-16 lg:pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="rounded-2xl border border-accent/35 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 px-6 py-8 shadow-sm sm:px-10">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex items-start gap-4 text-center md:text-left">
                <div className="hidden shrink-0 rounded-full bg-accent p-4 shadow-md sm:block">
                  <HandHeart className="h-7 w-7 text-white" aria-hidden />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {t.support.title}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {t.support.text}
                  </p>
                </div>
              </div>
              {/* Desktop: nebeneinander · Mobil: untereinander, große Touch-Flächen */}
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                <PaypalButton />
                <KofiButton />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
