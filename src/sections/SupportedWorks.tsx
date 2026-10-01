import { useState } from 'react'
import { ExternalLink, HandHeart, Landmark } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLang } from '@/data/lang'
import { SITE } from '@/data/books'
import { textsFor } from '@/data/texts'

type SupportedOrganization = {
  id?: string
  name: string
  url: string
  logo?: string
  logoBackground?: 'light' | 'dark'
  descriptionDe?: string
  descriptionEn?: string
  flyerDe?: string
  flyerEn?: string
}

type SiteWithSupportedOrganizations = {
  supportedOrganizations?: SupportedOrganization[]
}

// Beschreibung auf drei Zeilen gekürzt; „Mehr lesen" zeigt den ganzen Text (nur wenn er überhaupt länger ist)
function DescriptionText({ text, more, less }: { text: string; more: string; less: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 170
  return (
    <div className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
      <p className={long && !open ? 'line-clamp-3' : undefined}>
        <RichText text={text} />
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-1 inline-flex min-h-10 items-center text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? less : more}
        </button>
      ) : null}
    </div>
  )
}

export default function SupportedWorks() {
  const lang = useLang()
  const t = textsFor(lang).supportedWorks
  const [activeFlyer, setActiveFlyer] = useState<{ src: string; organization: string } | null>(null)
  const organizations = ((SITE as unknown as SiteWithSupportedOrganizations).supportedOrganizations ?? []).filter(
    (organization) => organization.name.trim() && organization.url.trim(),
  )

  return (
    <section id="unterstuetzte-werke" className="scroll-mt-40 border-y border-accent/20 bg-accent/[0.045] py-14 lg:scroll-mt-32 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h2>
          {t.firstBefore || t.firstStrong || t.firstAfter ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <RichText text={t.firstBefore} />
              {t.firstStrong ? (
                <> {' '}<strong className="font-bold text-foreground"><RichText text={t.firstStrong} /></strong></>
              ) : null}
              {t.firstAfter ? <> {' '}<RichText text={t.firstAfter} /></> : null}
            </p>
          ) : null}
          {t.second ? <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg"><RichText text={t.second} /></p> : null}
          {t.third ? <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg"><RichText text={t.third} /></p> : null}
        </Reveal>

        {organizations.length > 0 ? (
          <div className="mt-9 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((organization, index) => {
              const description =
                lang === 'en'
                  ? organization.descriptionEn || organization.descriptionDe
                  : organization.descriptionDe
              const flyer = lang === 'en'
                ? organization.flyerEn || organization.flyerDe
                : organization.flyerDe || organization.flyerEn
              return (
                <Reveal key={organization.id || `${organization.name}-${index}`} delay={index * 100}>
                  <article className="flex h-full flex-col rounded-2xl border border-accent/25 bg-background p-5 text-center shadow-sm sm:p-6">
                    <div
                      className={`flex h-20 w-full items-center justify-center rounded-xl px-5 ${
                        organization.logoBackground === 'dark' ? 'bg-primary' : 'bg-card'
                      }`}
                    >
                      {organization.logo ? (
                        <img
                          src={organization.logo}
                          alt={`Logo ${organization.name}`}
                          className="max-h-16 max-w-[12rem] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
                          <Landmark className="h-7 w-7 text-accent" strokeWidth={1.5} aria-hidden />
                          {organization.name}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{organization.name}</h3>
                    <DescriptionText text={description || ''} more={t.more} less={t.less} />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border/70 pt-4 text-sm font-bold">
                      {flyer ? (
                        <a
                          href={flyer}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-haspopup="dialog"
                          onClick={(event) => {
                            event.preventDefault()
                            setActiveFlyer({ src: flyer, organization: organization.name })
                          }}
                          className="inline-flex min-h-9 items-center text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {t.viewFlyer}
                        </a>
                      ) : null}
                      <a
                        href={organization.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1.5 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {t.visit}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        ) : null}
        <div className="mt-10 text-center">
          <a
            href="#unterstuetzen"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
          >
            <HandHeart className="h-5 w-5" aria-hidden />
            {t.supportCta}
          </a>
        </div>
      </div>

      <Dialog open={!!activeFlyer} onOpenChange={(open) => !open && setActiveFlyer(null)}>
        <DialogContent className="flex h-[92vh] w-[96vw] max-w-5xl flex-col overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0 pr-8 text-left">
            <DialogTitle className="font-display text-2xl font-semibold">
              {t.flyerTitle}: {activeFlyer?.organization}
            </DialogTitle>
            <DialogDescription>{t.flyerDescription}</DialogDescription>
          </DialogHeader>
          {activeFlyer ? (
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-secondary/40">
              {/\.pdf(?:\?|$)/i.test(activeFlyer.src) ? (
                <iframe
                  src={activeFlyer.src}
                  title={`${t.flyerTitle}: ${activeFlyer.organization}`}
                  className="h-full min-h-[60vh] w-full bg-white"
                />
              ) : (
                <div className="flex h-full min-h-[60vh] items-center justify-center overflow-auto p-3">
                  <img
                    src={activeFlyer.src}
                    alt={`${t.flyerTitle}: ${activeFlyer.organization}`}
                    className="max-h-full max-w-full object-contain shadow-lg"
                  />
                </div>
              )}
            </div>
          ) : null}
          {activeFlyer ? (
            <a
              href={activeFlyer.src}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto inline-flex shrink-0 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline"
            >
              {t.openFlyerNewTab}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
