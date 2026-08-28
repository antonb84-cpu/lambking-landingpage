import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function Footer() {
  const t = textsFor(useLang())

  const NAV = [
    { label: t.nav.books, href: '#buecher' },
    { label: t.nav.how, href: '#so-funktionierts' },
    { label: t.nav.app, href: '#app' },
    { label: t.nav.about, href: '#ueber' },
    { label: t.nav.faq, href: '#faq' },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <img
              src="images/logo.webp"
              alt="LambKing Stories"
              className="mx-auto h-14 w-auto rounded-md bg-background px-3 py-2 shadow-md md:mx-0"
            />
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
              {t.footer.tagline}
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-primary-foreground/80" aria-label="Fußzeilen-Navigation">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-primary-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          {SITE.paypalUrl && (
            <a
              href={SITE.paypalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-[1.05]"
              aria-label={t.support.paypalAlt}
            >
              <img
                src="images/buttons/paypal.png"
                alt={t.support.paypalAlt}
                className="h-10 w-auto"
              />
            </a>
          )}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} LambKing Stories. {t.footer.rights}</p>
          <div className="flex gap-5">
            {/* Eigene, direkt aufrufbare Seiten – gleicher Tab */}
            <a href="impressum.html" className="hover:text-primary-foreground">
              {t.footer.impressum}
            </a>
            <a href="datenschutz.html" className="hover:text-primary-foreground">
              {t.footer.datenschutz}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
