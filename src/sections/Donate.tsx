import { useEffect, useState } from 'react'
import { Check, ChevronDown, HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import KofiButton from '@/components/KofiButton'
import PaypalButton from '@/components/PaypalButton'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Bereich für freiwillige Unterstützung (PayPal & Ko-fi), bewusst leise: eine schmale Zeile, die sich erst
// auf Klick öffnet. Das Menü („Unterstützen“) und Links mit #unterstuetzen öffnen sie von selbst.
// Die Links kommen aus dem Admin (SITE.paypalUrl / SITE.kofiUrl).
const isDonateHash = () => typeof window !== 'undefined' && window.location.hash === '#unterstuetzen'

export default function Donate({ embedded = false }: { embedded?: boolean }) {
  const lang = useLang()
  const t = textsFor(lang).donate
  const [open, setOpen] = useState(isDonateHash)

  useEffect(() => {
    const onHash = () => {
      if (isDonateHash()) setOpen(true)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (!SITE.paypalUrl && !SITE.kofiUrl) return null

  const row = (
          <div className="rounded-2xl border border-border bg-card/60">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="unterstuetzen-inhalt"
              className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground sm:px-5"
            >
              <span className="flex items-center gap-2.5">
                <HandHeart className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                {t.eyebrow}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open ? (
              <div id="unterstuetzen-inhalt" className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
                <h2 className="font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{t.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                  <RichText text={t.text} />
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-foreground/60">{t.itemsTitle}</p>
                <ul className="mt-2 grid gap-1.5">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <PaypalButton />
                  <KofiButton />
                </div>
                <p className="mt-3 text-xs text-foreground/60">{t.note}</p>
              </div>
            ) : null}
          </div>
  )

  // Im Bereich „Unsere Vision“ (embedded) steht die Zeile ohne eigenen Abschnitt unter dem Text
  if (embedded) return <div id="unterstuetzen" className="scroll-mt-44"><Reveal>{row}</Reveal></div>
  return (
    <section id="unterstuetzen" className="scroll-mt-28 pb-6 pt-4 lg:pb-8 lg:pt-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>{row}</Reveal>
      </div>
    </section>
  )
}
