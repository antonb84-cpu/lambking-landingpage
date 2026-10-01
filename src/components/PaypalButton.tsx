import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Die Grafiken sind auf die sichtbare Pill zugeschnitten (paypal-*-crop.png)
// und haben transparente Ecken – Höhe fix, Breite ergibt sich aus dem Seitenverhältnis.
export default function PaypalButton({ compact = false }: { compact?: boolean }) {
  const lang = useLang()
  const t = textsFor(lang)
  if (!SITE.paypalUrl) return null

  return (
    <a
      href={SITE.paypalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block shrink-0 transition-transform hover:scale-[1.05] ${compact ? '' : 'h-12 w-[264px]'}`}
      aria-label={t.support.paypalAlt}
    >
      <img
        src={`images/buttons/paypal-${lang}-trim.png`}
        alt={t.support.paypalAlt}
        className={`block ${compact ? 'h-9 w-auto' : 'h-full w-full'}`}
      />
    </a>
  )
}
