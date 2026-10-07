import { Gift, Mail, Users } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { BULK_DISCOUNT_TIERS } from '@/data/bulk'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Für Kinderstunde, Schule und Gemeinde: der Mengenrabatt steht sichtbar auf der Seite (nicht nur im Buchfenster).
export default function Groups() {
  const texts = textsFor(useLang())
  const g = texts.groups
  const books = texts.books
  const mail = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(books.bulkDiscountEmailSubject)}`
  return (
    <section id="gruppen" className="scroll-mt-28 px-4 pb-4 pt-12 sm:px-6 lg:pt-16">
      <Reveal>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.10] via-card to-card shadow-sm">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                <Users className="h-4 w-4" aria-hidden />
                {g.eyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{g.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{g.text}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={mail}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
                >
                  <Mail className="h-5 w-5" aria-hidden />
                  {g.cta}
                </a>
                {SITE.hiddenSections.includes('freebie') ? null : (
                  <a
                    href="#gratis"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-background px-6 py-3 font-bold text-primary transition-colors hover:border-primary/50"
                  >
                    <Gift className="h-5 w-5" aria-hidden />
                    {g.freebie}
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-bold text-muted-foreground">{g.tiersTitle}</p>
              <ul className="grid grid-cols-2 gap-3">
                {BULK_DISCOUNT_TIERS.map((tier) => (
                  <li key={tier.quantity} className="rounded-2xl border border-border bg-background px-4 py-3 text-center shadow-sm">
                    <p className="font-display text-3xl font-bold text-primary">{tier.discount} %</p>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      {books.bulkDiscountFrom} {tier.quantity} {books.bulkDiscountPieces}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
