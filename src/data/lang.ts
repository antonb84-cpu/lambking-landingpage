// ─────────────────────────────────────────────────────────────
// Sprachsteuerung der Landingpage (Deutsch / English)
// Umschalten über den DE/EN-Schalter im Header oder ?lang=en
// in der Adresse. Die Auswahl bleibt im Browser gespeichert.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

export type Lang = 'de' | 'en'

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'de'
  const url = new URLSearchParams(window.location.search).get('lang')
  if (url === 'en' || url === 'de') return url
  const saved = window.localStorage.getItem('lambking-lang')
  return saved === 'en' ? 'en' : 'de'
}

let current: Lang = initialLang()
const subs = new Set<() => void>()

export function setLang(l: Lang) {
  current = l
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('lambking-lang', l)
    document.documentElement.lang = l
  }
  subs.forEach((f) => f())
}

/** Aktuelle Sprache in Komponenten verwenden */
export function useLang(): Lang {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((x) => x + 1)
    subs.add(f)
    return () => {
      subs.delete(f)
    }
  }, [])
  return current
}
