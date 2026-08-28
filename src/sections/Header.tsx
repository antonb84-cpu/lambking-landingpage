import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { SITE } from '@/data/books'
import { setLang, useLang, type Lang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { openLegal } from '@/data/openLegal'
import type { ReactNode } from 'react'

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
  const btn = (l: Lang, flag: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      title={l === 'de' ? 'Deutsch' : 'English'}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
        lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {flag}
      {label}
    </button>
  )
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border-2 border-border bg-card p-0.5"
      role="group"
      aria-label="Sprache wählen / Choose language"
    >
      {btn('de', <FlagDE />, 'DE')}
      {btn('en', <FlagGB />, 'EN')}
    </div>
  )
}

export default function Header() {
  const t = textsFor(useLang())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)

  const NAV = [
    { label: t.nav.books, href: '#buecher' },
    { label: t.nav.how, href: '#so-funktionierts' },
    { label: t.nav.app, href: '#app' },
    { label: t.nav.about, href: '#ueber' },
    { label: t.nav.faq, href: '#faq' },
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center" aria-label="LambKing Stories – Startseite">
          <img
            src="images/logo.webp"
            alt="LambKing Stories"
            className="h-11 w-auto transition-transform hover:scale-[1.04] sm:h-14"
          />
        </a>
        <nav className="hidden items-center gap-6 text-sm font-bold text-muted-foreground lg:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          {SITE.paypalUrl && (
            <a
              href={SITE.paypalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden transition-transform hover:scale-[1.05] sm:inline-block"
              aria-label={t.support.paypalAlt}
            >
              <img
                src="images/buttons/paypal.png"
                alt={t.support.paypalAlt}
                className="h-9 w-auto sm:h-10"
              />
            </a>
          )}
          {/* Hamburger – nur mobil sichtbar */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-card text-foreground lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobiles Menü */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          ref={menuRef}
          aria-label="Mobile Navigation"
          className="border-t border-border bg-background px-4 py-3 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-secondary"
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
                className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-bold text-foreground transition-colors hover:bg-secondary"
              >
                {t.footer.impressum}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); openLegal('datenschutz') }}
                className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-bold text-foreground transition-colors hover:bg-secondary"
              >
                {t.footer.datenschutz}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
