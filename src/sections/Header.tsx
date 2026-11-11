import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Menu, Search, X } from 'lucide-react'
import { setLang, useLang, type Lang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { openLegal } from '@/data/openLegal'
import { creatorPartnerHref, homeHref } from '@/data/routes'
import { BOOKS, CATEGORIES, SITE } from '@/data/books'
import { catLabelOf } from '@/data/bookView'
import { editionsOf } from '@/data/editions'
import { SHOP_FILTER_EVENT, applyShopFilter, initialShopFilter, isHomePage, lastShopFilter, shopHref, shopTexts, type ShopFilter } from '@/data/shop'
import { isBookPath } from '@/data/bookLink'
import type { FormEvent, MouseEvent, ReactNode } from 'react'

function FlagDE() {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shadow-sm" aria-hidden>
      <rect width="20" height="4.67" fill="#000" />
      <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
      <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
    </svg>
  )
}

function FlagGB() {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shadow-sm" aria-hidden>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="2.6" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#C8102E" strokeWidth="1.3" />
      <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4.4" />
      <path d="M10 0 V14 M0 7 H20" stroke="#C8102E" strokeWidth="2.6" />
    </svg>
  )
}

function LangSwitch() {
  const lang = useLang()
  const t = textsFor(lang)
  const btn = (l: Lang, flag: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      title={l === 'de' ? 'Deutsch' : 'English'}
      className={`flex items-center gap-1.5 rounded-full min-h-9 px-2.5 py-1 text-xs font-bold transition-colors ${
        lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {flag}
      <span className="sm:hidden">{label}</span>
      <span className="hidden sm:inline">{l === 'de' ? 'Deutsch' : 'English'}</span>
    </button>
  )
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border-2 border-border bg-card p-0.5"
      role="group"
      aria-label={t.a11y.languageChooser}
    >
      {btn('de', <FlagDE />, 'DE')}
      {btn('en', <FlagGB />, 'EN')}
    </div>
  )
}

function SearchForm({ mobile = false }: { mobile?: boolean }) {
  const lang = useLang()
  const s = shopTexts(lang)
  const [query, setQuery] = useState(() => initialShopFilter().query ?? '')
  const id = mobile ? 'shop-search-mobile' : 'shop-search'

  // Der Bücherbereich kann die Suche leeren („Filter zurücksetzen“): das Feld zieht mit
  useEffect(() => {
    const onFilter = (event: Event) => {
      const detail = (event as CustomEvent<ShopFilter>).detail
      if (detail.query !== undefined) setQuery(detail.query)
    }
    window.addEventListener(SHOP_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(SHOP_FILTER_EVENT, onFilter)
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (isHomePage()) applyShopFilter({ query })
    else window.location.assign(shopHref({ query }))
  }

  return (
    <form role="search" onSubmit={submit} className={mobile ? 'relative w-full' : 'relative mx-auto hidden w-full max-w-xl md:block'}>
      <label className="sr-only" htmlFor={id}>{s.searchLabel}</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          if (isHomePage()) applyShopFilter({ query: event.target.value }, false)
        }}
        placeholder={s.searchPlaceholder}
        className="h-11 w-full rounded-full border-2 border-border bg-card pl-10 pr-4 text-sm font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
      />
    </form>
  )
}

export default function Header() {
  const lang = useLang()
  const t = textsFor(lang)
  const s = shopTexts(lang)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)

  // Bucharten mit mindestens einem Buch in dieser Sprache
  const categories = CATEGORIES.filter((c) =>
    BOOKS.some((b) => b.category === c.id && (b.lang === lang || editionsOf(b).some((edition) => edition.language === lang))),
  )
  // Auf der Startseite filtert der Klick den Bücherbereich; von anderen Seiten führt der Link dorthin
  const shopLink = (category: string) => ({
    href: isHomePage() ? '#buecher' : shopHref({ category }),
    onClick: (event: MouseEvent) => {
      setMenuOpen(false)
      if (!isHomePage()) return
      event.preventDefault()
      applyShopFilter({ category })
    },
  })

  const SHOP_NAV = [
    { key: 'all', label: s.allBooks, ...shopLink('') },
    ...categories.map((c) => ({ key: c.id, label: catLabelOf(c.id, lang), ...shopLink(c.id) })),
  ]
  const NAV = [
    ...(SITE.hiddenSections.includes('app') ? [] : [{ label: t.nav.app, href: homeHref('#app') }]),
    { label: t.nav.about, href: homeHref('#ueber') },
    { label: t.nav.faq, href: homeHref('#faq') },
    { label: t.nav.support, href: homeHref('#unterstuetzen') },
    ...(SITE.creatorPartnerEnabled
      ? [{ label: t.creatorPartner.navLabel, href: creatorPartnerHref() }]
      : []),
  ]

  // Escape schließt das Menü, Fokus geht zurück auf den Button
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    // Fokus ins Menü setzen
    menuRef.current?.querySelector('a')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      {/* Schmale Leiste über der Kopfzeile: drei Kurzversprechen (scrollt mit weg) */}
      <div className="bg-primary text-primary-foreground">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 px-4 py-1.5 text-[11px] font-semibold sm:text-xs">
          {t.hero.trust.map((item, index) => (
            <li key={item} className={index < 2 ? 'hidden sm:block' : ''}>{item}</li>
          ))}
        </ul>
      </div>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:h-20 sm:px-6">
          <a href={homeHref()} className="flex shrink-0 items-center" aria-label={t.a11y.brandHome}>
            <img
              src="images/lambking-stories-logo-v2-256.webp?v=2"
              alt="LambKing Stories"
              className="h-[62px] w-[62px] object-contain transition-transform hover:scale-[1.04] sm:h-[74px] sm:w-[74px]"
            />
          </a>
          <SearchForm />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LangSwitch />
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.a11y.closeMenu : t.a11y.openMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-card text-foreground lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
        {/* Handy: Suchfeld in eigener Zeile */}
        <div className="px-4 pb-2.5 md:hidden"><SearchForm mobile /></div>

        {/* Desktop: Bucharten links, übrige Seitenbereiche rechts */}
        <nav className="hidden border-t border-border/70 lg:block" aria-label={t.a11y.mainNavigation}>
          <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-6 whitespace-nowrap px-6 text-sm font-bold">
            <div className="flex items-center gap-6">
              {SHOP_NAV.map((n) => (
                <a key={n.key} href={n.href} onClick={n.onClick} className="text-foreground transition-colors hover:text-primary">
                  {n.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-5 text-muted-foreground">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
                  {n.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Auf einer Buchseite: immer sichtbarer Weg zurück zur Liste, mit der zuletzt gewählten Buchart und Suche */}
        {isBookPath() ? (
          <div className="border-t border-border/70 bg-background/95">
            <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6">
              <a
                href={shopHref(lastShopFilter())}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-card px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {s.backAll}
              </a>
            </div>
          </div>
        ) : null}

        {/* Mobiles Menü */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            ref={menuRef}
            aria-label={t.a11y.mobileNavigation}
            className="max-h-[70vh] overflow-y-auto border-t border-border bg-background px-4 py-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {SHOP_NAV.map((n) => (
                <li key={n.key}>
                  <a href={n.href} onClick={n.onClick} className="block rounded-lg px-3 py-3 text-base font-bold text-foreground transition-colors hover:bg-secondary">
                    {n.label}
                  </a>
                </li>
              ))}
              <li aria-hidden className="my-1.5 border-t border-border" />
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-bold text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              {/* Rechtsseiten öffnen als Fenster (wie im Footer) */}
              <li>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openLegal('impressum') }}
                  className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold text-foreground/80 transition-colors hover:bg-secondary"
                >
                  {t.footer.impressum}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openLegal('datenschutz') }}
                  className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold text-foreground/80 transition-colors hover:bg-secondary"
                >
                  {t.footer.datenschutz}
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>
    </>
  )
}
