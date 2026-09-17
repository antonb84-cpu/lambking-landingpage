import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BookOpenText,
  Check,
  CircleDollarSign,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Link2,
  Mail,
  Megaphone,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import Header from '@/sections/Header'
import Footer from '@/sections/Footer'
import Reveal from '@/components/Reveal'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { creatorPartnerHref } from '@/data/routes'
import { textsFor } from '@/data/texts'
import {
  creatorApplicationMailto,
  type CreatorApplicationPayload,
} from '@/data/creatorApplication'

const audienceIcons = [UsersRound, HeartHandshake, BookOpenText, GraduationCap]
const processIcons = [Send, Link2, Megaphone, CircleDollarSign]

type SubmitState = 'idle' | 'invalid' | 'email-ready'

const fieldClass =
  'mt-2 min-h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10'

export default function CreatorPartnerPage() {
  const lang = useLang()
  const t = textsFor(lang)
  const cp = t.creatorPartner
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [platformError, setPlatformError] = useState(false)
  const [emailFallback, setEmailFallback] = useState('')

  const emailFields = useMemo(
    () => [
      cp.fields.fullName,
      cp.fields.email,
      cp.fields.country,
      cp.fields.language,
      cp.fields.platforms,
      cp.fields.profileUrls,
      cp.fields.followers,
      cp.fields.niche,
      cp.fields.communityFit,
      cp.fields.amazonAffiliate,
    ],
    [cp],
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const platforms = data.getAll('platforms').map(String)
    const hasPlatforms = platforms.length > 0
    setPlatformError(!hasPlatforms)

    if (!form.checkValidity() || !hasPlatforms) {
      setSubmitState('invalid')
      form.reportValidity()
      return
    }

    const payload: CreatorApplicationPayload = {
      fullName: String(data.get('fullName') || '').trim(),
      email: String(data.get('email') || '').trim(),
      country: String(data.get('country') || '').trim(),
      language: String(data.get('language') || '').trim(),
      platforms,
      profileUrls: String(data.get('profileUrls') || '').trim(),
      followers: String(data.get('followers') || '').trim(),
      niche: String(data.get('niche') || '').trim(),
      communityFit: String(data.get('communityFit') || '').trim(),
      amazonAffiliate: String(data.get('amazonAffiliate')) as 'yes' | 'no',
    }

    const emailUrl = creatorApplicationMailto(
      SITE.contactEmail,
      payload,
      { subject: cp.emailSubject, fields: emailFields },
    )
    setEmailFallback(emailUrl)
    setSubmitState('email-ready')
    window.location.href = emailUrl
  }

  return (
    <div className="min-h-screen">
      <a
        href={`${creatorPartnerHref()}#creator-main`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:font-bold focus:text-primary-foreground"
      >
        {t.a11y.skipToContent}
      </a>
      <Header />
      <main id="creator-main">
        <section className="texture-paper overflow-hidden border-b border-border/80">
          <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
            <Reveal>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {cp.heroTitle}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {cp.heroText}
              </p>
              <a
                href={`${creatorPartnerHref()}#bewerbung`}
                className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                {cp.applyNow}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </a>
            </Reveal>

            <Reveal delay={140} className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-4 top-8 h-44 w-44 rounded-full bg-accent/15 blur-3xl" aria-hidden />
              <div className="absolute -right-4 bottom-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden />
              <div className="relative rounded-[2rem] border-2 border-border bg-card/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-9">
                <div className="flex items-center gap-4 border-b border-border pb-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Handshake className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="font-display text-2xl font-semibold text-foreground">LambKing Stories</p>
                </div>
                <div className="mt-7 flex items-end justify-center gap-3 sm:gap-5" aria-hidden>
                  <img
                    src="images/cover-bibelgeschichten-zum-ausmalen.jpg"
                    alt=""
                    className="w-[29%] -rotate-6 rounded-md shadow-xl"
                  />
                  <img
                    src="images/cover-david.jpg"
                    alt=""
                    className="z-10 w-[34%] rounded-md shadow-2xl"
                  />
                  <img
                    src="images/cover-zachaeus.jpg"
                    alt=""
                    className="w-[29%] rotate-6 rounded-md shadow-xl"
                  />
                </div>
                <p className="mx-auto mt-7 max-w-md text-center font-semibold leading-relaxed text-primary">
                  {cp.microCreatorNote}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.audienceTitle}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{cp.audienceIntro}</p>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {cp.audienceItems.map((item, index) => {
                const Icon = audienceIcons[index]
                return (
                  <Reveal key={item.title} delay={index * 70}>
                    <article className="flex h-full gap-5 rounded-2xl border-2 border-border bg-card p-6 shadow-sm sm:p-7">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                        <p className="mt-2 leading-relaxed text-muted-foreground">{item.text}</p>
                      </div>
                    </article>
                  </Reveal>
                )
              })}
            </div>
            <p className="mt-8 text-center font-bold text-primary">{cp.microCreatorNote}</p>
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-3xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.howTitle}</h2>
              <p className="mt-4 text-lg text-primary-foreground/75">{cp.howIntro}</p>
            </Reveal>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {cp.howSteps.map((step, index) => {
                const Icon = processIcons[index]
                return (
                  <Reveal key={step.title} delay={index * 70}>
                    <article className="relative border-t border-primary-foreground/25 pt-7">
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="font-display text-4xl font-semibold text-primary-foreground/20">0{index + 1}</span>
                      </div>
                      <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-primary-foreground/70">{step.text}</p>
                    </article>
                  </Reveal>
                )
              })}
            </div>
            <Reveal delay={220} className="mt-12 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 px-6 py-5">
              <p className="flex gap-3 text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                {cp.attributionNote}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bg-secondary/55 py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.compensationTitle}</h2>
              <blockquote className="mt-7 border-l-4 border-accent pl-6 font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">
                {cp.compensationRate}
              </blockquote>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-2xl border-2 border-border bg-card p-7 shadow-sm sm:p-8">
                <ul className="space-y-5">
                  {cp.compensationDetails.map((detail) => (
                    <li key={detail} className="flex gap-3 leading-relaxed text-muted-foreground">
                      <Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.benefitsTitle}</h2>
            </Reveal>
            <div className="mx-auto mt-12 max-w-4xl divide-y divide-border border-y border-border">
              {cp.benefits.map((benefit, index) => (
                <Reveal key={benefit} delay={index * 45}>
                  <div className="flex items-center gap-4 py-5 sm:py-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-base font-bold sm:text-lg">{benefit}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="bewerbung" className="scroll-mt-28 bg-secondary/55 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.formTitle}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{cp.formIntro}</p>
            </Reveal>

            <Reveal delay={100} className="mt-10 rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-xl shadow-primary/5 sm:p-9 lg:p-12">
              <form noValidate onSubmit={handleSubmit} className="space-y-7">
                <p className="text-sm text-muted-foreground">{cp.requiredHint}</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="font-bold">
                    {cp.fields.fullName} *
                    <input className={fieldClass} name="fullName" autoComplete="name" required />
                  </label>
                  <label className="font-bold">
                    {cp.fields.email} *
                    <input className={fieldClass} name="email" type="email" autoComplete="email" required />
                  </label>
                  <label className="font-bold">
                    {cp.fields.country} *
                    <input className={fieldClass} name="country" autoComplete="country-name" required />
                  </label>
                  <label className="font-bold">
                    {cp.fields.language} *
                    <select className={fieldClass} name="language" defaultValue="" required>
                      <option value="" disabled>—</option>
                      {cp.languageOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="font-bold">{cp.fields.platforms} *</legend>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {cp.platformOptions.map((platform) => (
                      <label key={platform} className="cursor-pointer">
                        <input
                          type="checkbox"
                          name="platforms"
                          value={platform}
                          className="peer sr-only"
                          onChange={() => setPlatformError(false)}
                        />
                        <span className="inline-flex min-h-11 items-center rounded-full border-2 border-border bg-white px-4 py-2 text-sm font-bold transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20">
                          {platform}
                        </span>
                      </label>
                    ))}
                  </div>
                  {platformError && <p className="mt-2 text-sm font-semibold text-destructive">{cp.validationError}</p>}
                </fieldset>

                <label className="block font-bold">
                  {cp.fields.profileUrls} *
                  <textarea className={`${fieldClass} min-h-28 resize-y`} name="profileUrls" required />
                  <span className="mt-1.5 block text-sm font-normal text-muted-foreground">{cp.profileHint}</span>
                </label>

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="font-bold">
                    {cp.fields.followers} *
                    <input className={fieldClass} name="followers" type="number" min="0" inputMode="numeric" required />
                  </label>
                  <label className="font-bold">
                    {cp.fields.niche} *
                    <input className={fieldClass} name="niche" required />
                  </label>
                </div>

                <label className="block font-bold">
                  {cp.fields.communityFit} *
                  <textarea className={`${fieldClass} min-h-36 resize-y`} name="communityFit" required />
                </label>

                <fieldset>
                  <legend className="font-bold">{cp.fields.amazonAffiliate} *</legend>
                  <div className="mt-3 flex gap-3">
                    {(['yes', 'no'] as const).map((value) => (
                      <label key={value} className="cursor-pointer">
                        <input type="radio" name="amazonAffiliate" value={value} className="peer sr-only" required />
                        <span className="inline-flex min-h-11 min-w-20 items-center justify-center rounded-full border-2 border-border bg-white px-5 py-2 font-bold transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20">
                          {value === 'yes' ? cp.fields.yes : cp.fields.no}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/45 p-4 leading-relaxed">
                  <input type="checkbox" name="privacyAcknowledged" required className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                  <span className="text-sm text-muted-foreground">
                    {cp.fields.privacyBefore}
                    <a href="datenschutz.html" className="font-bold text-primary underline underline-offset-2">
                      {cp.fields.privacyLink}
                    </a>
                    {cp.fields.privacyAfter} *
                  </span>
                </label>

                <div aria-live="polite" className="space-y-4">
                  {submitState === 'invalid' && (
                    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 font-semibold text-destructive">
                      {cp.validationError}
                    </p>
                  )}
                  {submitState === 'email-ready' && (
                    <div className="rounded-xl border border-accent/35 bg-accent/10 p-5">
                      <p className="font-display text-xl font-semibold">{cp.emailReadyTitle}</p>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{cp.emailReadyText}</p>
                      <a
                        href={emailFallback}
                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary px-5 py-2 font-bold text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                      >
                        <Mail className="h-4 w-4" aria-hidden />
                        {cp.emailApplication}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:w-auto"
                >
                  <Send className="h-5 w-5" aria-hidden />
                  {cp.emailApplication}
                </button>
              </form>
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal className="text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cp.faqTitle}</h2>
            </Reveal>
            <Reveal delay={90} className="mt-10 rounded-2xl border-2 border-border bg-card px-5 sm:px-8">
              <Accordion type="single" collapsible>
                {cp.faqItems.map((item, index) => (
                  <AccordionItem key={item.q} value={`creator-faq-${index}`}>
                    <AccordionTrigger className="py-5 text-base font-bold sm:text-lg">{item.q}</AccordionTrigger>
                    <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/55 py-16">
          <Reveal className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold">{cp.contactTitle}</h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">{cp.contactText}</p>
            </div>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <Mail className="h-5 w-5" aria-hidden />
              {cp.contactCta}
            </a>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  )
}
