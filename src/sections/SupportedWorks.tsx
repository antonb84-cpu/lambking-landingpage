import { useState } from 'react'
import { ExternalLink, FileText, Landmark } from 'lucide-react'
import Reveal from '@/components/Reveal'
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

export default function SupportedWorks() {
  const lang = useLang()
  const t = textsFor(lang).supportedWorks
  const [activeFlyer, setActiveFlyer] = useState<{ src: string; organization: string } | null>(null)
  const organizations = ((SITE as unknown as SiteWithSupportedOrganizations).supportedOrganizations ?? []).filter(
    (organization) => organization.name.trim() && organization.url.trim(),
  )

  return (
    <section id="unterstuetzte-werke" className="border-y border-accent/20 bg-accent/[0.045] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.firstBefore}
            {t.firstStrong ? (
              <strong className="font-bold text-foreground">{t.firstStrong}</strong>
            ) : null}
            {t.firstAfter}
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.second}
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.third}
          </p>
          {organizations.length > 0 ? (
            <p className="mt-7 font-bold text-foreground">{t.current}</p>
          ) : null}
        </Reveal>

        {organizations.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
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
                  <article className="flex h-full flex-col rounded-2xl border border-accent/25 bg-background p-6 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
                    <div
                      className={`mx-auto flex h-24 w-full items-center justify-center rounded-xl px-5 ${
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
                    <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                      {organization.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                    <div className="mt-5 flex flex-col items-center gap-3">
                      {flyer ? (
                        <button
                          type="button"
                          onClick={() => setActiveFlyer({ src: flyer, organization: organization.name })}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary/20 px-5 py-2 text-sm font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <FileText className="h-4 w-4" aria-hidden />
                          {t.viewFlyer}
                        </button>
                      ) : null}
                      <a
                        href={organization.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {t.visit}
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        ) : null}
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
