import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function Faq() {
  const t = textsFor(useLang())

  return (
    <section id="faq" className="scroll-mt-20 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.faq.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.faq.title}
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <Accordion type="single" collapsible className="mt-8">
            {t.faq.items.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-bold hover:text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {f.a}
                  {/* Frage „digital?" → Web-App-Link anhängen */}
                  {i === 4 && SITE.appUrl.startsWith('https://') && (
                    <>
                      {' '}
                      <a
                        href={SITE.appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-primary underline underline-offset-2"
                      >
                        {t.faq.webAppLink}
                      </a>
                    </>
                  )}
                  {/* Kontaktfrage → E-Mail-Adresse als mailto-Link */}
                  {i === 6 && SITE.contactEmail && (
                    <>
                      {' '}
                      <a
                        href={`mailto:${SITE.contactEmail}`}
                        className="font-bold text-primary underline underline-offset-2"
                      >
                        {SITE.contactEmail}
                      </a>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
