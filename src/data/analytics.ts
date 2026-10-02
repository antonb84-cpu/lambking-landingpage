import { SITE } from '@/data/books'

type AnalyticsEvent =
  | { event: 'pageview' }
  | { event: 'amazon_click'; target: string }

let pageViewSent = false

function endpoint(): string {
  return String(SITE.analyticsUrl || '').replace(/\/+$/, '')
}

/** Lokale Vorschau (Entwicklung, Admin-Vorschau) zählt nicht mit – sonst verfälschen eigene Tests die Zahlen. */
export function isLocalPreview(): boolean {
  if (typeof window === 'undefined') return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' || host.endsWith('.localhost')
}

function send(event: AnalyticsEvent): void {
  const url = endpoint()
  if (!url || isLocalPreview()) return

  const body = JSON.stringify(event)
  if (typeof navigator.sendBeacon === 'function') {
    const payload = new Blob([body], { type: 'text/plain;charset=UTF-8' })
    if (navigator.sendBeacon(`${url}/event`, payload)) return
  }

  void fetch(`${url}/event`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    keepalive: true,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  }).catch(() => {
    // Statistik darf die Landingpage niemals beeinträchtigen.
  })
}

/** Zählt genau einen Seitenaufruf pro vollständig geladener SPA-Sitzung. */
export function trackPageView(): void {
  if (pageViewSent) return
  pageViewSent = true
  send({ event: 'pageview' })
}

const TARGET_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

/**
 * Zählt ausschließlich, welcher Amazon-Knopf angeklickt wurde: Buch und Sprach-Ausgabe, z. B. „david-de".
 * (Das Ziel darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten – der Zähldienst lehnt alles andere ab.)
 */
export function trackAmazonClick(bookId: string, language = ''): void {
  const target = language ? `${bookId}-${language}` : bookId
  if (!TARGET_PATTERN.test(target)) return
  send({ event: 'amazon_click', target })
}

export type TrackedLink = 'paypal' | 'kofi' | 'playstore' | 'appstore'

/**
 * Zählt Klicks auf Spenden- und App-Store-Knöpfe. Der Zähldienst kennt nur die Ereignisse „pageview" und
 * „amazon_click"; diese Klicks werden deshalb mit dem Ziel „link-paypal", „link-kofi", „link-playstore" bzw.
 * „link-appstore" gezählt. Im Admin erscheinen sie in einer eigenen Tabelle.
 */
export function trackLinkClick(link: TrackedLink): void {
  send({ event: 'amazon_click', target: `link-${link}` })
}

/** Mittlere Maustaste (neuer Tab) löst „click" nicht aus – dafür gibt es „auxclick". */
export function isMiddleClick(event: { button: number }): boolean {
  return event.button === 1
}

export type SelfTestResult = { ok: boolean; local: boolean; status: number | null; message: string }

/**
 * Selbsttest für die Zählung (nur über ?zaehler-test=1 sichtbar): schickt ein Test-Ereignis mit dem Ziel
 * „selbsttest" (taucht in keiner Tabelle auf) und meldet, ob der Zähldienst im Browser erreichbar ist.
 */
export async function counterSelfTest(): Promise<SelfTestResult> {
  const url = endpoint()
  if (!url) return { ok: false, local: false, status: null, message: 'Es ist kein Zähldienst eingetragen.' }
  if (isLocalPreview()) {
    return { ok: false, local: true, status: null, message: 'Lokale Vorschau: Hier wird absichtlich nicht gezählt. Bitte auf lambking.store testen.' }
  }
  try {
    const response = await fetch(`${url}/event`, {
      method: 'POST',
      body: JSON.stringify({ event: 'amazon_click', target: 'selbsttest' }),
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (response.status === 204) return { ok: true, local: false, status: 204, message: 'Der Zähldienst hat das Test-Ereignis angenommen. Die Zählung funktioniert in diesem Browser.' }
    return { ok: false, local: false, status: response.status, message: `Der Zähldienst hat mit Fehler ${response.status} geantwortet.` }
  } catch {
    return { ok: false, local: false, status: null, message: 'Die Anfrage wurde blockiert. Vermutlich verhindert ein Werbeblocker oder der Brave-Schutz („Shields“) die Zählung in diesem Browser. Bitte Schutz für diese Seite ausschalten und erneut testen.' }
  }
}
