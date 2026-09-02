import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { OPEN_LEGAL_EVENT, type LegalKind } from '@/data/openLegal'

function LegalText({ text }: { text: string }) {
  // Leerzeile = neuer Absatz; eine Zeile, die wie eine Überschrift aussieht, wird fett
  const blocks = text.split(/\n\s*\n/)
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        const [first, ...rest] = lines
        const looksLikeHeading = rest.length > 0 && first.length < 70 && !first.endsWith('.')
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
  const [legal, setLegal] = useState<LegalKind | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const legalText = legal === 'impressum' ? SITE.impressum : SITE.datenschutz

  // Auch aus dem mobilen Menü heraus öffnen
  useEffect(() => {
    const onOpen = (e: Event) => setLegal((e as CustomEvent<LegalKind>).detail)
    window.addEventListener(OPEN_LEGAL_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_LEGAL_EVENT, onOpen)
  }, [])

  const NAV = [
    { label: t.nav.books, href: '#buecher' },
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
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} LambKing Stories. {t.footer.rights}</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {SITE.contactEmail && (
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary-foreground/25 px-4 py-1.5 font-bold text-primary-foreground transition-colors hover:border-primary-foreground/50 hover:bg-primary-foreground/10"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {t.contact.write}
              </button>
            )}
            {/* Öffnen ein Fenster auf derselben Seite – kein neuer Tab */}
            <button type="button" onClick={() => setLegal('impressum')} className="hover:text-primary-foreground">
              {t.footer.impressum}
            </button>
            <button type="button" onClick={() => setLegal('datenschutz')} className="hover:text-primary-foreground">
              {t.footer.datenschutz}
            </button>
          </div>
        </div>
      </div>

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

      <Dialog open={!!legal} onOpenChange={(open) => !open && setLegal(null)}>
        <DialogContent className="max-h-[85vh] w-[92vw] max-w-2xl overflow-y-auto rounded-md border-2 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              {legal === 'impressum' ? t.footer.impressumTitle : t.footer.datenschutzTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {legal === 'impressum' ? t.footer.impressumTitle : t.footer.datenschutzTitle}
            </DialogDescription>
          </DialogHeader>
          {legalText ? (
            <LegalText text={legalText} />
          ) : (
            <p className="text-sm text-muted-foreground">{t.footer.legalEmpty}</p>
          )}
          {/* Zusätzlich als eigene, direkt verlinkbare Seite (z. B. für Behörden/Druck) */}
          <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            <a
              href={legal === 'impressum' ? 'impressum.html' : 'datenschutz.html'}
              className="font-bold text-primary underline underline-offset-2"
            >
              {t.footer.legalFullPage} →
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
