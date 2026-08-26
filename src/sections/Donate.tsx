import { HandHeart, Lock } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function Donate() {
  const t = textsFor(useLang())
  return (
    <section id="spenden" className="scroll-mt-28 pb-16 lg:pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-accent/35 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 px-6 py-7 shadow-sm sm:px-10 md:flex-row md:justify-between">
            <div className="flex items-start gap-4 text-center md:text-left">
              <div className="hidden shrink-0 rounded-full bg-accent p-4 shadow-md sm:block">
                <HandHeart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  {t.donate.title}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t.donate.text}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <a
                href={SITE.paypalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-[1.05]"
                aria-label="Projekt mit PayPal unterstützen"
              >
                <img
                  src="/images/buttons/paypal.png"
                  alt="PayPal – Projekt unterstützen"
                  className="h-12 w-auto"
                />
              </a>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                {t.donate.note}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
