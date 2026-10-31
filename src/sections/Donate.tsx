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
    <section id="unterstuetzen" className="scroll-mt-28 pb-10 pt-8 lg:pb-14 lg:pt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(222_58%_24%)] text-primary-foreground shadow-lg shadow-primary/15">
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="relative grid items-center gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[0.45fr_1.55fr] lg:gap-8 lg:py-8">
              <div className="mx-auto w-28 sm:w-36 lg:w-full lg:max-w-[170px]">
                <img
                  src="images/lamm-freisteller.webp"
                  alt=""
                  aria-hidden
                  className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.3)]"
                  loading="lazy"
                />
              </div>
              <div className="text-center lg:text-left">
                <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  <HandHeart className="h-4 w-4" aria-hidden />
                  {t.eyebrow}
                </p>
                <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{t.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                  <RichText text={t.text} />
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-accent">{t.itemsTitle}</p>
                <ul className="mt-2 grid gap-1.5 text-left">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm font-semibold">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <PaypalButton />
                  <KofiButton />
                </div>
                <p className="mt-3 text-xs text-primary-foreground/70">{t.note}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
