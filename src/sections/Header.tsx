import { useEffect, useRef, useState } from 'react'
import { Mail, Menu, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const lang = useLang()
  const t = textsFor(lang)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
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
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#top" className="flex items-center" aria-label="LambKing Stories – Startseite">
          <img
            src="images/lambking-logo.png"
            alt="LambKing Stories"
            className="h-14 w-auto transition-transform hover:scale-[1.04] sm:h-16"
          />
        </a>
        <nav className="hidden items-center gap-5 text-sm font-bold text-muted-foreground lg:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {SITE.contactEmail && (
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full border-2 border-border bg-card px-3 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary/5 xl:inline-flex"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {t.contact.write}
            </button>
          )}
          <LangSwitch />
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
            {SITE.contactEmail && (
              <li>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setContactOpen(true) }}
                  className="flex items-center gap-2 rounded-lg px-3 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <Mail className="h-5 w-5 text-primary" aria-hidden />
                  {t.contact.write}
                </button>
              </li>
            )}
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

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="w-[92vw] max-w-md rounded-2xl border-2 bg-background p-7 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl font-semibold">{t.contact.title}</DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed">{t.contact.intro}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.contact.emailLabel}</p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="mt-2 block break-all font-semibold text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
            >
              {SITE.contactEmail}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
