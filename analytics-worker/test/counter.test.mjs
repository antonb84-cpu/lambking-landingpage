import assert from 'node:assert/strict'
import test from 'node:test'
import worker, { berlinDay, mondayOf } from '../src/index.js'
import { withAnalyticsPrivacy } from '../privacy.mjs'

test('Berlin calendar day is used', () => {
  assert.equal(berlinDay(new Date('2026-09-10T22:30:00Z')), '2026-09-11')
})

test('weekly period starts on Monday', () => {
  assert.equal(mondayOf('2026-09-11'), '2026-09-07')
  assert.equal(mondayOf('2026-09-07'), '2026-09-07')
})

test('page view stores only day, event type and empty target', async () => {
  let bound = null
  const env = {
    ALLOWED_ORIGINS: 'https://lambking.store',
    DB: {
      prepare() {
        return {
          bind(...values) {
            bound = values
            return { run: async () => ({ success: true }) }
          },
        }
      },
    },
  }
  const request = new Request('https://counter.example/event', {
    method: 'POST',
    headers: { Origin: 'https://lambking.store', 'Content-Type': 'text/plain' },
    body: JSON.stringify({ event: 'pageview', ignored: 'not stored' }),
  })
  const response = await worker.fetch(request, env)
  assert.equal(response.status, 204)
  assert.equal(bound.length, 3)
  assert.equal(bound[1], 'pageview')
  assert.equal(bound[2], '')
})

test('statistics require token and return aggregate rows', async () => {
  const env = {
    ADMIN_TOKEN: 'secret',
    DB: {
      prepare() {
        return {
          bind() {
            return {
              all: async () => ({ results: [
                { event_type: 'pageview', target_id: '', today_count: 4, week_count: 9, total_count: 12 },
                { event_type: 'amazon_click', target_id: 'david', today_count: 1, week_count: 2, total_count: 3 },
              ] }),
            }
          },
        }
      },
    },
  }
  const denied = await worker.fetch(new Request('https://counter.example/stats'), env)
  assert.equal(denied.status, 401)
  const allowed = await worker.fetch(new Request('https://counter.example/stats', {
    headers: { Authorization: 'Bearer secret' },
  }), env)
  assert.equal(allowed.status, 200)
  const data = await allowed.json()
  assert.deepEqual(data.pageviews, { today: 4, week: 9, total: 12 })
  assert.equal(data.amazonClicks[0].bookId, 'david')
})

test('privacy notice is updated once and existing sections stay intact', () => {
  const source = '3. Spracheinstellung\r\n\r\n4. Keine Cookies, kein Tracking\r\n\r\nDiese Website verwendet keine Cookies und keine Analyse- oder Marketing-Dienste. Schriftarten werden lokal von dieser Website geladen, nicht von externen Diensten.\r\n\r\n5. Externe Links\r\n\r\nText\r\n\r\n6. Kontaktaufnahme per E-Mail\r\n\r\nText\r\n\r\n7. Ihre Rechte\r\n\r\nStand: August 2026'
  const updated = withAnalyticsPrivacy(source)
  assert.match(updated, /4\. Anonyme Reichweitenmessung/)
  assert.match(updated, /5\. Keine Cookies und keine Wiedererkennung/)
  assert.match(updated, /6\. Externe Links/)
  assert.match(updated, /7\. Kontaktaufnahme per E-Mail/)
  assert.match(updated, /8\. Ihre Rechte/)
  assert.match(updated, /Stand: September 2026/)
  assert.equal(withAnalyticsPrivacy(updated), updated)
})
