import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { BOOKS, CATEGORIES, COMING_SOON, type Book } from '@/data/books'
import { bookPath } from '@/data/bookLink'
import { catLabelOf, localizedBook } from '@/data/bookView'
import { editionsOf } from '@/data/editions'
import { useLang } from '@/data/lang'
import { OPEN_BOOK_EVENT } from '@/data/openBook'
import { AGE_BUCKETS, SHOP_FILTER_EVENT, ageBucketsOf, applyShopFilter, initialShopFilter, saveShopFilter, shopTexts, type ShopFilter } from '@/data/shop'
import { textsFor } from '@/data/texts'
import { splitTitle } from '@/data/titles'

type Sort = 'recommended' | 'newest' | 'title'

const smallChip = (active: boolean) =>
  `inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 ${
    active ? 'border-primary bg-primary text-primary-foreground' : 'border-[#d9cdb0] bg-white text-foreground/80 hover:border-primary/50 hover:text-foreground'
  }`

const chipClass = (active: boolean) =>
  `inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 ${
    active ? 'border-primary bg-primary text-primary-foreground' : 'border-[#d9cdb0] bg-white text-foreground/80 hover:border-primary/50 hover:text-foreground'
  }`

// Bücherbereich als Shop: Filter nach Buchart und Alter, Sortierung, Suche (Feld in der Kopfzeile) und ein
// gleichmäßiges Raster aus Produktkarten. Jede Karte führt auf die eigene Buchseite.
export default function Shop() {
  const lang = useLang()
  const t = textsFor(lang)
  const s = shopTexts(lang)
  const [category, setCategory] = useState<string>(() => initialShopFilter().category ?? 'all')
  const [age, setAge] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('recommended')
  const [query, setQuery] = useState<string>(() => initialShopFilter().query ?? '')
  // Alter und Sortierung stehen eingeklappt hinter einem kleinen Knopf (nur die Buchart bleibt groß sichtbar)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Auswahl merken: „Zurück zu allen Büchern“ auf den Buchseiten führt dorthin zurück
  useEffect(() => saveShopFilter({ category: category === 'all' ? undefined : category, query: query.trim() || undefined }), [category, query])

  // Kopfzeile (Kategorien, Suche) meldet Filter über ein Ereignis
  useEffect(() => {
    const onFilter = (event: Event) => {
      const detail = (event as CustomEvent<ShopFilter>).detail
      if (detail.category !== undefined) {
        setCategory(detail.category || 'all')
        setAge('all')
      }
      if (detail.query !== undefined) setQuery(detail.query)
    }
    // Klick auf das Buch im Titelbereich öffnet dessen Buchseite
    const onOpen = (event: Event) => {
      const found = BOOKS.find((b) => b.id === (event as CustomEvent<string>).detail)
      if (found) window.location.assign(bookPath(found))
    }
    window.addEventListener(SHOP_FILTER_EVENT, onFilter)
    window.addEventListener(OPEN_BOOK_EVENT, onOpen)
    return () => {
      window.removeEventListener(SHOP_FILTER_EVENT, onFilter)
      window.removeEventListener(OPEN_BOOK_EVENT, onOpen)
    }
  }, [])

  // Strikte Trennung: die englische Seite zeigt nur Bücher mit englischer Ausgabe (und umgekehrt)
  const books = useMemo(
    () => BOOKS.filter((b) => b.lang === lang || editionsOf(b).some((edition) => edition.language === lang)),
    [lang],
  )
  const known = (id: string) => CATEGORIES.some((c) => c.id === id)
  const categoryOf = (b: Book) => (known(b.category) ? b.category : 'weitere')
  const categories = [
    ...CATEGORIES.map((c) => ({ id: c.id, label: catLabelOf(c.id, lang) })),
    { id: 'weitere', label: lang === 'en' ? 'More' : 'Weitere' },
  ]
    .map((c) => ({ ...c, count: books.filter((b) => categoryOf(b) === c.id).length }))
    .filter((c) => c.count > 0)
  const activeCategory = categories.some((c) => c.id === category) ? category : 'all'
  const inCategory = books.filter((b) => activeCategory === 'all' || categoryOf(b) === activeCategory)
  const ages = AGE_BUCKETS.filter((key) => inCategory.some((b) => ageBucketsOf(b).includes(key)))
  const activeAge = ages.some((key) => key === age) ? age : 'all'

  const needle = query.trim().toLowerCase()
  const visible = inCategory
    .filter((b) => activeAge === 'all' || ageBucketsOf(b).includes(activeAge))
    .filter((b) => {
      if (!needle) return true
      const shown = localizedBook(b, lang)
      return [shown.title, shown.series ?? '', shown.description, shown.age, shown.detail, catLabelOf(b.category, lang)]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  const sorted = [...visible]
  if (sort === 'newest') sorted.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))
  if (sort === 'title') sorted.sort((a, b) => splitTitle(localizedBook(a, lang)).main.localeCompare(splitTitle(localizedBook(b, lang)).main, lang))

  const filtered = activeCategory !== 'all' || activeAge !== 'all' || !!needle
  // Leeren läuft über das gemeinsame Ereignis, damit das Suchfeld in der Kopfzeile mitzieht
  const reset = () => applyShopFilter({ category: '', query: '' }, false)

  return (
    <section id="buecher" className="scroll-mt-40 py-10 lg:scroll-mt-44 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.books.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.books.title}</h2>
          <p className="mt-2 text-muted-foreground"><RichText text={t.books.subtitle} /></p>
        </Reveal>

        <div className="mt-6 rounded-2xl border border-[#e1d5b8] bg-[#fffdf8] p-3 shadow-[0_18px_30px_-26px_rgba(21,49,103,0.55)] sm:p-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={s.categoryLabel}>
            <button type="button" className={chipClass(activeCategory === 'all')} aria-pressed={activeCategory === 'all'} onClick={() => { setCategory('all'); setAge('all') }}>
              {s.allBooks} <span className="text-xs font-semibold opacity-70">{books.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" className={chipClass(activeCategory === c.id)} aria-pressed={activeCategory === c.id} onClick={() => { setCategory(c.id); setAge('all') }}>
                {c.label} <span className="text-xs font-semibold opacity-70">{c.count}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-[#eadfc2] pt-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="shop-filter-panel"
              className="inline-flex min-h-9 items-center gap-2 rounded-full px-2 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {s.filterToggle}
              {activeAge !== 'all' || sort !== 'recommended' ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground" aria-label={s.filterActive}>
                  {(activeAge !== 'all' ? 1 : 0) + (sort !== 'recommended' ? 1 : 0)}
                </span>
              ) : null}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {filtersOpen ? (
              <div id="shop-filter-panel" className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-1">
                {ages.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={s.ageLabel}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.ageLabel}</span>
                    <button type="button" className={smallChip(activeAge === 'all')} aria-pressed={activeAge === 'all'} onClick={() => setAge('all')}>{s.allAges}</button>
                    {ages.map((key) => (
                      <button key={key} type="button" className={smallChip(activeAge === key)} aria-pressed={activeAge === key} onClick={() => setAge(key)}>{s.ages[key]}</button>
                    ))}
                  </div>
                ) : <span />}
                <label className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                  {s.sortLabel}
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as Sort)}
                    className="min-h-9 rounded-full border border-[#d9cdb0] bg-white px-3 py-1 text-[13px] font-bold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
                  >
                    <option value="recommended">{s.sortRecommended}</option>
                    <option value="newest">{s.sortNewest}</option>
                    <option value="title">{s.sortTitle}</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-muted-foreground" aria-live="polite">
          <span>{sorted.length === 1 ? s.resultOne : s.resultMany.replace('{n}', String(sorted.length))}</span>
          {needle ? (
            <button type="button" onClick={() => applyShopFilter({ query: '' }, false)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#d9cdb0] bg-white px-3 py-1 text-sm font-bold text-foreground">
              {s.searchChip}: „{query.trim()}“ <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          {filtered ? (
            <button type="button" onClick={reset} className="font-bold text-primary underline-offset-4 hover:underline">{s.reset}</button>
          ) : null}
        </div>

        {sorted.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {sorted.map((b) => (
              <li key={b.id}><ProductCard book={b} /></li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-accent/35 bg-accent/5 px-6 py-10 text-center">
            <p className="font-semibold">{books.length ? s.noResults : t.books.emptyAll}</p>
          </div>
        )}

        {lang === 'de' && COMING_SOON.length > 0 && !filtered ? (
          <p className="mt-8 text-center text-sm font-semibold text-muted-foreground">
            <span className="font-bold text-foreground">{t.books.growing}</span> {COMING_SOON.join(' · ')}
          </p>
        ) : null}
      </div>
    </section>
  )
}
