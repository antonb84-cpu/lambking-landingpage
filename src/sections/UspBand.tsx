import { BookHeart, Languages, ShieldCheck, Smartphone } from 'lucide-react'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

const ICONS = [BookHeart, ShieldCheck, Languages, Smartphone]

// Schmale Leiste direkt unter dem Hero: vier Kurzversprechen statt Kennzahlen.
export default function UspBand() {
  const t = textsFor(useLang()).usp
  return (
    <section aria-label={t.items.map((item) => item.title).join(', ')} className="border-b border-border bg-card/70">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 sm:px-6 lg:grid-cols-4">
        {t.items.map((item, i) => {
          const Icon = ICONS[i] ?? BookHeart
          return (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold sm:text-base">{item.title}</span>
                <span className="text-xs text-muted-foreground sm:text-sm">{item.text}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
