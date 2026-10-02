import { BookOpen, HandHeart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import RichText from '@/components/RichText'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function Hero() {
  const lang = useLang()
  const t = textsFor(lang)
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      {/* Titelbild: mobil oben, ab lg als Hintergrund hinter dem Text */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/8] xl:absolute xl:inset-0 xl:aspect-auto">
        <picture>
          <source media="(min-width: 1280px)" srcSet="images/hero-titel-breit.jpg" />
          <source media="(min-width: 768px)" srcSet="images/hero-titel.jpg" />
          <img
            src="images/hero-titel-mobil.jpg"
            alt={t.hero.videoAlt}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[70%_50%] xl:absolute xl:inset-0 xl:object-[50%_35%]"
          />
        </picture>
        <div
          className="pointer-events-none absolute inset-0 hidden xl:block"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--background) / 0.8) 0%, hsl(var(--background) / 0.62) 26%, hsl(var(--background) / 0.2) 44%, hsl(var(--background) / 0) 58%)',
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl px-4 pb-10 pt-8 sm:px-6 xl:min-h-[max(700px,min(54vw,800px))] xl:items-start xl:pb-24 xl:pt-14">
        <Reveal className="max-w-[32rem]">
          <h1 className="font-display text-4xl font-semibold leading-[1.14] tracking-tight sm:text-5xl xl:text-[3.1rem]">
            <span className="xl:block">{t.hero.title1}</span>{' '}
            <span className="italic text-accent xl:block">{t.hero.title2}</span>
          </h1>
          <p className="mt-5 text-base font-medium leading-relaxed text-foreground/80 sm:text-lg">
            <RichText text={t.hero.subtitle} />
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#buecher"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              <BookOpen className="h-5 w-5" aria-hidden />
              {t.hero.ctaBooks}
            </a>
            <a
              href="#unterstuetzen"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
            >
              <HandHeart className="h-5 w-5" aria-hidden />
              {t.hero.ctaSupport}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
