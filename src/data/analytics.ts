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

/** Zählt ausschließlich, welcher Buch-Amazon-Link angeklickt wurde. */
export function trackAmazonClick(bookId: string): void {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(bookId)) return
  send({ event: 'amazon_click', target: bookId })
}
