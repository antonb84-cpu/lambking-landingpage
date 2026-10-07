import { Check, HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import KofiButton from '@/components/KofiButton'
import PaypalButton from '@/components/PaypalButton'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Zentraler Bereich für freiwillige Unterstützung (PayPal & Ko-fi).
// Die Links kommen aus dem Admin (SITE.paypalUrl / SITE.kofiUrl).
export default function Donate() {
  const lang = useLang()
  const t = textsFor(lang).donate
  if (!SITE.paypalUrl && !SITE.kofiUrl) return null

  return (
    <section id="unterstuetzen" className="scroll-mt-28 pb-16 pt-14 lg:pb-24 lg:pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[hsl(222_58%_22%)] text-primary-foreground shadow-xl shadow-primary/25">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden />
            <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12 lg:py-14">
              <div className="mx-auto w-48 sm:w-60 lg:w-full lg:max-w-xs">
                <img
                  src="images/lamm-freisteller.webp"
                  alt=""
                  aria-hidden
                  className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]"
                  loading="lazy"
                />
              </div>
              <div className="text-center lg:text-left">
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  <HandHeart className="h-4 w-4" aria-hidden />
                  {t.eyebrow}
                </p>
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
                  <RichText text={t.text} />
                </p>
                <p className="mt-6 text-sm font-bold uppercase tracking-wider text-accent">{t.itemsTitle}</p>
                <ul className="mt-3 grid gap-2 text-left">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-semibold">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-4 w-4" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <PaypalButton />
                  <KofiButton />
                </div>
                <p className="mt-5 text-sm text-primary-foreground/75">{t.note}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
