import { useState } from 'react'
import { Check } from 'lucide-react'
import FlipBook from '@/components/FlipBook'
import Reveal from '@/components/Reveal'
import { BOOKS } from '@/data/books'
import { coverFor } from '@/data/covers'
import { pickFeatured } from '@/data/featured'
import { hasFlipbook } from '@/data/flipbooks'
import { useLang } from '@/data/lang'
import { openFlipBookById } from '@/data/openBook'
import { textsFor } from '@/data/texts'
import { splitTitle, volumeLabel } from '@/data/titles'

// „Blick ins Buch": große Leseprobe zum Durchblättern. Mit der Buchauswahl lässt sich jedes Buch mit
// Blätterbuch ansehen; mit den Flaggen wechselt die Sprache.
export default function TryIt() {
  const lang = useLang()
  const texts = textsFor(lang)
  const t = texts.tryit
  const facts = texts.books.coloringFacts.slice(0, 4)
  const candidates = BOOKS.filter((book) => hasFlipbook(book.id))
  const featured = pickFeatured()
  const initial = featured && hasFlipbook(featured.id) ? featured : candidates[0] ?? featured
  const [selectedId, setSelectedId] = useState(initial?.id ?? '')
  const book = BOOKS.find((item) => item.id === selectedId) ?? initial
  if (!book) return null // alle Bücher ausgeblendet

  return (
    <section id="ausprobieren" className="scroll-mt-28 texture-paper relative overflow-hidden py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {t.eyebrow}
            <span className="h-px w-8 bg-accent" aria-hidden />
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.text}</p>
        </Reveal>

        {candidates.length > 1 ? (
          <Reveal delay={60} className="mt-8">
            <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">{t.choose}</p>
            <ul className="flex flex-wrap items-stretch justify-center gap-3">
              {candidates.map((item) => {
                const active = item.id === book.id
                const { main } = splitTitle(item)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-pressed={active}
                      className={`flex h-full w-[104px] flex-col items-center gap-1.5 rounded-2xl border-2 bg-card p-2 text-center transition sm:w-[124px] ${
                        active ? 'border-accent shadow-md shadow-accent/20' : 'border-border opacity-80 hover:border-primary/40 hover:opacity-100'
                      }`}
                    >
                      <img src={coverFor(item).src} alt="" loading="lazy" className="aspect-[8.5/11] w-full rounded-[3px] object-cover shadow" draggable={false} aria-hidden />
                      {volumeLabel(item) ? <span className="text-[10px] font-bold uppercase tracking-wide text-accent">{volumeLabel(item)}</span> : null}
                      <span className="text-xs font-semibold leading-tight">{main}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        ) : null}

        <Reveal delay={100} className="relative mt-8">
          {/* warmer Lichtschein hinter dem Buch */}
          <div
            className="pointer-events-none absolute left-1/2 top-[44%] h-[115%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
            style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.22), hsl(var(--accent) / 0.08) 55%, transparent 100%)' }}
            aria-hidden
          />
          <div className="relative z-10">
            <FlipBook key={`${book.id}-${lang}`} book={book} onFullscreen={() => openFlipBookById(book.id)} />
          </div>
        </Reveal>

        <Reveal delay={140} className="mt-8">
          <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2">
            {facts.map((fact) => (
              <li key={fact} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {fact}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
