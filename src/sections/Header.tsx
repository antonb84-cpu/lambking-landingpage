import { SITE } from '@/data/books'
import { setLang, useLang, type Lang } from '@/data/lang'
import { textsFor } from '@/data/texts'

function LangSwitch() {
  const lang = useLang()
  const btn = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
        lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border-2 border-border bg-card p-0.5"
      aria-label="Sprache wählen / Choose language"
    >
      {btn('de', 'DE')}
      {btn('en', 'EN')}
    </div>
  )
}

export default function Header() {
  const t = textsFor(useLang())
  const NAV = [
    { label: t.nav.books, href: '#buecher' },
    { label: t.nav.how, href: '#so-funktionierts' },
    { label: t.nav.app, href: '#app' },
    { label: t.nav.about, href: '#ueber' },
    { label: t.nav.faq, href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center" aria-label="LambKing Stories – Startseite">
          <img
            src="/images/logo.webp"
            alt="LambKing Stories"
            className="h-11 w-auto transition-transform hover:scale-[1.04] sm:h-14"
          />
        </a>
        <nav className="hidden items-center gap-6 text-sm font-bold text-muted-foreground lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <a
            href={SITE.paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-[1.05]"
            aria-label="Projekt mit PayPal unterstützen"
          >
            <img
              src="/images/buttons/paypal.png"
              alt="PayPal – Projekt unterstützen"
              className="h-9 w-auto sm:h-10"
            />
          </a>
        </div>
      </div>
    </header>
  )
}
