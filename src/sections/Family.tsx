import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import LoopVideo from '@/components/LoopVideo'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import gallery from '@/data/gallery.json'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

type Item = { image: string; captionDe?: string; captionEn?: string }

// Eigene Videos der Familie: public/videos/kids/<name>.mp4 + .jpg (Standbild)
const CLIPS = ['ausmalen-meer', 'buch-durchblaettern', 'ausmalen-schildkroete', 'ausmalen-buntstifte']

// „Familien malen mit": vier Standbilder der Töchter (Video lädt erst beim Antippen)
// und die Galerie „Eure Kunstwerke" (bis zu drei von Eltern eingesandte Bilder).
// Einsenden läuft per E-Mail, es werden keine Daten über die Website übertragen.
// Galerie-Bilder: src/data/gallery.json + Dateien in public/images/galerie/.
export default function Family() {
  const lang = useLang()
  const texts = textsFor(lang)
  const k = texts.kids
  const a = texts.artwork
  const items = ((gallery as unknown as { items?: Item[] }).items ?? []).slice(0, 3)
  const [zoom, setZoom] = useState<{ src: string; caption: string } | null>(null)
  const mail = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(a.mailSubject)}&body=${encodeURIComponent(a.mailBody.replace(/\\n/g, '\n'))}`

  return (
    <section id="kinder" className="scroll-mt-28 py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{k.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{k.text}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CLIPS.map((clip, i) => (
            <Reveal key={clip} delay={i * 80}>
              <div className="relative overflow-hidden rounded-2xl border-2 border-card shadow-md shadow-primary/10">
                <LoopVideo
                  manual
                  src={`videos/kids/${clip}.mp4`}
                  poster={`videos/kids/${clip}.jpg`}
                  label={k.title}
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-12 text-center">
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{a.title}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{a.text}</p>
        </Reveal>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-3 sm:gap-5">
          {[0, 1, 2].map((i) => {
            const item = items[i]
            const caption = item ? (lang === 'en' ? item.captionEn : item.captionDe) || a.byline : ''
            return (
              <Reveal key={i} delay={i * 90}>
                <figure className="rounded-md border border-border bg-card p-1.5 shadow-md shadow-primary/10 sm:p-2.5">
                  {item ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setZoom({ src: item.image, caption })}
                        aria-label={`${caption} – ${a.enlarge}`}
                        className="block w-full cursor-zoom-in overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <img src={item.image} alt={caption} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
                      </button>
                      <figcaption className="pt-1.5 text-center text-[11px] font-semibold text-muted-foreground">{caption}</figcaption>
                    </>
                  ) : (
                    <a
                      href={mail}
                      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-accent/40 bg-accent/[0.06] p-2 text-center text-[11px] font-semibold leading-snug text-muted-foreground transition-colors hover:border-accent hover:bg-accent/10 sm:text-sm"
                    >
                      <Mail className="h-5 w-5 text-accent sm:h-6 sm:w-6" aria-hidden />
                      {a.empty}
                    </a>
                  )}
                </figure>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={150} className="mx-auto mt-6 max-w-2xl text-center">
          <a
            href={mail}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground shadow-md shadow-accent/30 transition-transform hover:scale-[1.03]"
          >
            <Mail className="h-5 w-5" aria-hidden />
            {a.send}
          </a>
          <details className="mt-4 rounded-xl border border-border bg-card/70 px-4 py-3 text-left text-sm shadow-sm">
            <summary className="cursor-pointer font-bold text-primary">{a.howTitle}</summary>
            <ol className="mt-3 grid gap-2 leading-relaxed text-muted-foreground">
              {a.steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </details>
        </Reveal>
      </div>

      <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-h-[94vh] w-[94vw] max-w-3xl overflow-auto p-3 sm:p-5">
          <DialogTitle className="sr-only">{a.title}</DialogTitle>
          <DialogDescription className="sr-only">{zoom?.caption}</DialogDescription>
          {zoom ? <img src={zoom.src} alt={zoom.caption} className="mx-auto max-h-[80vh] w-auto max-w-full rounded-md object-contain" /> : null}
          {zoom ? <p className="text-center text-sm font-semibold text-muted-foreground">{zoom.caption}</p> : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
