import { HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

/** Lokal gezeichneter Ko-fi-Becher – keine externen Ressourcen,
    keine Verbindung zu Ko-fi vor dem Klick. */
function KofiCup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" fill="#FF5E5B" stroke="none" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" stroke="#20242e" />
      <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" stroke="#20242e" />
      <path d="M7.5 4.5c0 1 .8 1.2.8 2M10.5 3.5c0 1 .8 1.2.8 2" stroke="#20242e" />
    </svg>
  )
}

export default function Donate() {
  const t = textsFor(useLang())
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
                {SITE.paypalUrl && (
                  <a
                    href={SITE.paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform hover:scale-[1.05]"
                    aria-label={t.support.paypalAlt}
                  >
                    <img
                      src="images/buttons/paypal.png"
                      alt={t.support.paypalAlt}
                      className="h-12 w-auto"
                    />
                  </a>
                )}
                {SITE.kofiUrl && (
                  <a
                    href={SITE.kofiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.support.kofiAlt}
                    className="inline-flex h-12 items-center gap-2.5 rounded-full border border-[#20242e]/15 bg-[#FFF8F0] px-6 font-bold text-[#20242e] shadow-sm transition-transform hover:scale-[1.05]"
                  >
                    <KofiCup className="h-6 w-6" />
                    {t.support.kofiAlt}
                  </a>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
