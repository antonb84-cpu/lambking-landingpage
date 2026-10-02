import { SITE } from '@/data/books'

type AnalyticsEvent =
  | { event: 'pageview' }
  | { event: 'amazon_click'; target: string }

let pageViewSent = false

function endpoint(): string {
  return String(SITE.analyticsUrl || '').replace(/\/+$/, '')
}

function send(event: AnalyticsEvent): void {
  const url = endpoint()
  if (!url || typeof window === 'undefined') return

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
