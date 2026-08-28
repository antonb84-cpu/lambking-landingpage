// ─────────────────────────────────────────────────────────────
// Sprachsteuerung der Landingpage (Deutsch / English)
// Umschalten über den DE/EN-Schalter im Header oder ?lang=en
// in der Adresse. Die Auswahl bleibt im Browser gespeichert
// (localStorage, Schlüssel „lambking-lang" – siehe Datenschutz).
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

export type Lang = 'de' | 'en'

const META: Record<Lang, { title: string; description: string }> = {
  de: {
    title: 'LambKing Stories – Bibelgeschichten zum Ausmalen',
    description:
      'Biblisch fundierte Malbücher und Kinderbücher von LambKing Stories. Inhalt ansehen und direkt bei Amazon bestellen.',
  },
  en: {
    title: 'LambKing Stories – Bible Stories to Color',
    description:
      "Bible-based coloring books and children's books by LambKing Stories. Look inside and order via Amazon.",
  },
}

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'de'
  const url = new URLSearchParams(window.location.search).get('lang')
  if (url === 'en' || url === 'de') return url
  const saved = window.localStorage.getItem('lambking-lang')
  return saved === 'en' ? 'en' : 'de'
}

function applyDocumentMeta(l: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = l
  document.title = META[l].title
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', META[l].description)
}

let current: Lang = initialLang()
const subs = new Set<() => void>()

export function setLang(l: Lang) {
  current = l
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('lambking-lang', l)
    applyDocumentMeta(l)
  }
  subs.forEach((f) => f())
}

// Beim ersten Laden html lang + Titel/Meta korrekt setzen
if (typeof window !== 'undefined') applyDocumentMeta(current)

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
