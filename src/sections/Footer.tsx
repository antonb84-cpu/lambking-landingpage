import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

type LegalKind = 'impressum' | 'datenschutz' | null

function LegalText({ text }: { text: string }) {
  // Leerzeile = neuer Absatz; eine Zeile, die wie eine Überschrift aussieht, wird fett
  const blocks = text.split(/\n\s*\n/)
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        const [first, ...rest] = lines
        const looksLikeHeading = rest.length > 0 && first.length < 60 && !first.endsWith('.')
        return (
          <div key={i}>
            {looksLikeHeading ? (
              <>
                <p className="font-bold text-foreground">{first}</p>
                <p className="mt-1 whitespace-pre-line">{rest.join('\n')}</p>
              </>
            ) : (
              <p className="whitespace-pre-line">{b}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Footer() {
  const t = textsFor(useLang())
  const [legal, setLegal] = useState<LegalKind>(null)
  const legalText = legal === 'impressum' ? SITE.impressum : SITE.datenschutz

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
              src="/images/logo.webp"
              alt="LambKing Stories"
              className="mx-auto h-14 w-auto rounded-md bg-background px-3 py-2 shadow-md md:mx-0"
            />
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
              {t.footer.tagline}
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-primary-foreground/80">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-primary-foreground">
                {n.label}
              </a>
            ))}
          </nav>
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
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} LambKing Stories. {t.footer.rights}</p>
          <div className="flex gap-5">
            <button type="button" onClick={() => setLegal('impressum')} className="hover:text-primary-foreground">
              {t.footer.impressum}
            </button>
            <button type="button" onClick={() => setLegal('datenschutz')} className="hover:text-primary-foreground">
              {t.footer.datenschutz}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!legal} onOpenChange={(open) => !open && setLegal(null)}>
        <DialogContent className="max-h-[85vh] w-[92vw] max-w-2xl overflow-y-auto rounded-md border-2 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              {legal === 'impressum' ? t.footer.impressumTitle : t.footer.datenschutzTitle}
            </DialogTitle>
          </DialogHeader>
          {legalText ? (
            <LegalText text={legalText} />
          ) : (
            <p className="text-sm text-muted-foreground">{t.footer.legalEmpty}</p>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  )
}
