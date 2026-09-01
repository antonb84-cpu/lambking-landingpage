import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function PaypalButton({ compact = false }: { compact?: boolean }) {
  const lang = useLang()
  const t = textsFor(lang)
  if (!SITE.paypalUrl) return null

  return (
    <a
      href={SITE.paypalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative inline-block shrink-0 overflow-hidden rounded-full transition-transform hover:scale-[1.05] ${
        compact ? 'h-10 w-[180px]' : 'h-[45px] w-[240px]'
      }`}
      aria-label={t.support.paypalAlt}
    >
      <img
        src={`images/buttons/paypal-${lang}.png`}
        alt={t.support.paypalAlt}
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 ${
          compact ? 'w-[180px]' : 'w-[240px]'
        }`}
      />
    </a>
  )
}
