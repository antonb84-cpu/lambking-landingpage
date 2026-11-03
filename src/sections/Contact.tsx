import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

type FieldName = 'name' | 'email' | 'message' | 'consent'
type Status = 'idle' | 'sending' | 'sent'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const inputClass =
  'mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'

// Kontaktformular: sendet an den eigenen Formular-Dienst (contact-worker). Die Prüfung hier ist nur
// Bedienkomfort – maßgeblich ist die Prüfung auf dem Server.
export default function Contact() {
  const c = textsFor(useLang()).contactForm
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldName[]>([])
  const [failure, setFailure] = useState<'' | 'rate' | 'send'>('')

  if (!SITE.contactFormUrl) return null

  const errorText: Record<FieldName, string> = {
    name: c.errorName,
    email: c.errorEmail,
    message: c.errorMessage,
    consent: c.errorConsent,
  }

  const focusFirst = (fields: FieldName[]) => {
    const first = fields[0]
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'sending') return
    const form = new FormData(event.currentTarget)
    const value = {
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      message: String(form.get('message') ?? '').trim(),
      consent: form.get('consent') === 'on',
      website: String(form.get('website') ?? ''),
    }
    const invalid: FieldName[] = []
    if (!value.name) invalid.push('name')
    if (!EMAIL_PATTERN.test(value.email)) invalid.push('email')
    if (value.message.length < 10) invalid.push('message')
    if (!value.consent) invalid.push('consent')
    setFailure('')
    setErrors(invalid)
    if (invalid.length) {
      focusFirst(invalid)
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(SITE.contactFormUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      })
      if (response.ok) {
        setStatus('sent')
        return
      }
      if (response.status === 422) {
        const body = (await response.json().catch(() => ({}))) as { fields?: FieldName[] }
        const fields = (body.fields ?? []).filter((f): f is FieldName => f in errorText)
        setErrors(fields)
        focusFirst(fields)
        setFailure(fields.length ? '' : 'send')
      } else {
        setFailure(response.status === 429 ? 'rate' : 'send')
      }
    } catch {
      setFailure('send')
    }
    setStatus('idle')
  }

  const describe = (field: FieldName) => (errors.includes(field) ? `contact-error-${field}` : undefined)
  const fieldError = (field: FieldName) =>
    errors.includes(field) ? (
      <p id={`contact-error-${field}`} className="mt-1.5 text-sm font-semibold text-destructive">
        {errorText[field]}
      </p>
    ) : null

  return (
    <section id="kontakt" className="scroll-mt-20 pb-16 pt-4 lg:pb-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{c.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{c.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{c.intro}</p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-primary/10 sm:p-8">
            {status === 'sent' ? (
              <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-7 w-7" aria-hidden />
                </span>
                <p className="font-display text-xl font-semibold">{c.success}</p>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={onSubmit}
                onChange={(e) => {
                  // Eine Fehlermeldung verschwindet, sobald das Feld wieder bearbeitet wird
                  const field = (e.target as unknown as { name: string }).name as FieldName
                  setErrors((current) => (current.includes(field) ? current.filter((f) => f !== field) : current))
                }}
                noValidate
                className="space-y-5"
                aria-busy={status === 'sending'}
              >
                <div>
                  <label htmlFor="contact-name" className="text-sm font-bold">{c.nameLabel}</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    required
                    aria-invalid={errors.includes('name')}
                    aria-describedby={describe('name')}
                    className={inputClass}
                  />
                  {fieldError('name')}
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-bold">{c.emailLabel}</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    aria-invalid={errors.includes('email')}
                    aria-describedby={describe('email')}
                    className={inputClass}
                  />
                  {fieldError('email')}
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-sm font-bold">{c.messageLabel}</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    maxLength={4000}
                    required
                    aria-invalid={errors.includes('message')}
                    aria-describedby={describe('message')}
                    className={`${inputClass} resize-y`}
                  />
                  {fieldError('message')}
                </div>

                {/* Honeypot: für Menschen unsichtbar und nicht erreichbar, Bots füllen es oft aus */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
                  <label>
                    Website
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                  </label>
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      aria-invalid={errors.includes('consent')}
                      aria-describedby={describe('consent')}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-[hsl(var(--primary))]"
                    />
                    <span>
                      {c.consentBefore}
                      <a href="datenschutz/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-2">
                        {c.consentLink}
                      </a>
                      {c.consentAfter}
                    </span>
                  </label>
                  {fieldError('consent')}
                </div>

                {failure && (
                  <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                    {failure === 'rate' ? c.errorRate : c.errorSend}
                    {failure === 'send' && SITE.contactEmail && (
                      <>
                        {' '}
                        <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-2">{SITE.contactEmail}</a>
                      </>
                    )}
                  </p>
                )}

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                    {status === 'sending' ? c.sending : c.submit}
                  </button>
                  {SITE.contactEmail && (
                    <p className="text-sm text-muted-foreground">
                      <Mail className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
                      {c.emailAlternative}{' '}
                      <a href={`mailto:${SITE.contactEmail}`} className="font-bold text-primary underline underline-offset-2">{SITE.contactEmail}</a>
                    </p>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{c.note}</p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
