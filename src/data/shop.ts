import type { Book } from './books'
import type { Lang } from './lang'
import { isBookPath } from './bookLink'
import { isCreatorPartnerPath } from './routes'

// Shop-Ansicht (Vorschau): Filter, Suche und Texte. Die Texte ziehen später ins Admin um (texts.defaults.json).

export const SHOP_FILTER_EVENT = 'lambking:shop-filter'

export interface ShopFilter {
  category?: string
  query?: string
}

/** Wurzel der Seite (auch auf Buchseiten, dort setzt index.html ein <base>). */
export const siteRoot = () => new URL('.', document.baseURI).href

export const isHomePage = () => !isBookPath() && !isCreatorPartnerPath()

/** Adresse der Startseite mit gesetztem Filter, für Links von Buchseiten aus. */
export function shopHref(filter: ShopFilter = {}): string {
  const url = new URL(siteRoot())
  if (filter.category) url.searchParams.set('kat', filter.category)
  if (filter.query) url.searchParams.set('q', filter.query)
  url.hash = 'buecher'
  return url.href
}

const LAST_FILTER_KEY = 'lk-shop-filter'

/** Merkt sich die zuletzt gewählte Auswahl (Buchart, Suche), damit „Zurück zu allen Büchern“ dort wieder ankommt. */
export function saveShopFilter(filter: ShopFilter) {
  try {
    sessionStorage.setItem(LAST_FILTER_KEY, JSON.stringify(filter))
  } catch { /* Speicher gesperrt: dann geht es zur ganzen Liste */ }
}

export function lastShopFilter(): ShopFilter {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_FILTER_KEY) ?? '{}') as ShopFilter
  } catch {
    return {}
  }
}

export function initialShopFilter(): ShopFilter {
  const params = new URLSearchParams(window.location.search)
  return { category: params.get('kat') ?? undefined, query: params.get('q') ?? undefined }
}

/** Auf der Startseite: Filter setzen, ohne neu zu laden. */
export function applyShopFilter(filter: ShopFilter, scroll = true) {
  window.dispatchEvent(new CustomEvent<ShopFilter>(SHOP_FILTER_EVENT, { detail: filter }))
  if (scroll) document.getElementById('buecher')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export const AGE_BUCKETS = ['3+', '5-8', '9-12'] as const
const BUCKET_RANGE: Record<string, [number, number]> = { '3+': [3, 4], '5-8': [5, 8], '9-12': [9, 12] }

/** Altersgruppen eines Buches: das Admin-Feld, sonst aus der Altersangabe („5–8 Jahre“, „ab 10 Jahren“) abgeleitet. */
export function ageBucketsOf(book: Book): string[] {
  if (book.ageGroup) return [book.ageGroup]
  const numbers = (book.age.match(/\d+/g) ?? []).map(Number)
  if (!numbers.length) return []
  const min = numbers[0]
  const max = numbers[1] ?? 12
  return AGE_BUCKETS.filter((key) => min <= BUCKET_RANGE[key][1] && max >= BUCKET_RANGE[key][0])
}

const TEXTS = {
  de: {
    heroApp: 'Entdecke unsere App',
    searchPlaceholder: 'Buch suchen',
    searchLabel: 'Bücher durchsuchen',
    allBooks: 'Alle Bücher',
    allAges: 'Jedes Alter',
    ageLabel: 'Alter',
    categoryLabel: 'Buchart',
    ages: { '3+': 'ab 3 Jahren', '5-8': '5–8 Jahre', '9-12': '9–12 Jahre' } as Record<string, string>,
    filterToggle: 'Filter & Sortierung',
    filterActive: 'Filter aktiv',
    sortLabel: 'Sortieren nach',
    sortRecommended: 'Empfohlen',
    sortNewest: 'Neueste zuerst',
    sortTitle: 'Titel A–Z',
    resultOne: '1 Buch',
    resultMany: '{n} Bücher',
    searchChip: 'Suche',
    noResults: 'Kein Buch gefunden. Probier einen anderen Suchbegriff oder setz die Filter zurück.',
    reset: 'Filter zurücksetzen',
    details: 'Zum Buch',
    home: 'Start',
    description: 'Beschreibung',
    insideTitle: 'Blick ins Buch',
    insideHint: 'Blättere durch das Buch: mit den Pfeilen, per Klick auf die Seite oder am Handy mit dem Finger.',
    related: 'Das passt dazu',
    soldVia: 'Bestellung, Druck und Versand über Amazon',
    editionLabel: 'Sprache der Ausgabe',
    backToBooks: 'Alle Bücher ansehen',
    backAll: 'Zurück zu allen Büchern',
    notFound: 'Dieses Buch gibt es hier nicht mehr.',
  },
  en: {
    heroApp: 'Discover our app',
    searchPlaceholder: 'Search books',
    searchLabel: 'Search the books',
    allBooks: 'All books',
    allAges: 'All ages',
    ageLabel: 'Age',
    categoryLabel: 'Type',
    ages: { '3+': 'ages 3+', '5-8': 'ages 5–8', '9-12': 'ages 9–12' } as Record<string, string>,
    filterToggle: 'Filters & sorting',
    filterActive: 'Filters active',
    sortLabel: 'Sort by',
    sortRecommended: 'Recommended',
    sortNewest: 'Newest first',
    sortTitle: 'Title A–Z',
    resultOne: '1 book',
    resultMany: '{n} books',
    searchChip: 'Search',
    noResults: 'No book found. Try another search term or reset the filters.',
    reset: 'Reset filters',
    details: 'View book',
    home: 'Home',
    description: 'Description',
    insideTitle: 'Look inside',
    insideHint: 'Flip through the book: use the arrows, click a page, or swipe on your phone.',
    related: 'You may also like',
    soldVia: 'Ordering, printing and shipping via Amazon',
    editionLabel: 'Edition language',
    backToBooks: 'See all books',
    backAll: 'Back to all books',
    notFound: 'This book is no longer available here.',
  },
}

export type ShopTexts = (typeof TEXTS)['de']
export const shopTexts = (lang: Lang): ShopTexts => TEXTS[lang]
