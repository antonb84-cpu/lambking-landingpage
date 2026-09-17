// ─────────────────────────────────────────────────────────────
// Sprachsteuerung der Landingpage (Deutsch / English)
// Umschalten über den DE/EN-Schalter im Header oder ?lang=en
// in der Adresse. Die Auswahl bleibt im Browser gespeichert
// (localStorage, Schlüssel „lambking-lang" – siehe Datenschutz).
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { isCreatorPartnerPath } from './routes'
import { SITE } from './books'

export type Lang = 'de' | 'en'

const META: Record<'home' | 'creatorPartner', Record<Lang, { title: string; description: string; canonical: string }>> = {
  home: {
    de: {
      title: 'LambKing Stories – Bibelgeschichten zum Ausmalen',
      description:
        'Biblisch fundierte Malbücher und Kinderbücher von LambKing Stories. Inhalt ansehen und direkt bei Amazon bestellen.',
      canonical: 'https://lambking.store/',
    },
    en: {
      title: 'LambKing Stories – Bible Stories to Color',
      description:
        "Bible-based coloring books and children's books by LambKing Stories. Look inside and order via Amazon.",
      canonical: 'https://lambking.store/',
    },
  },
  creatorPartner: {
    de: {
      title: 'Creator-Partner werden | LambKing Stories',
      description:
        'Bewirb dich als Creator-Partner von LambKing Stories und empfehle biblische Kinderbücher authentisch an deine Community.',
      canonical: 'https://lambking.store/creator-partner/',
    },
    en: {
      title: 'Become a Creator Partner | LambKing Stories',
      description:
        'Apply to become a LambKing Stories Creator Partner and authentically share Bible-based children’s books with your community.',
      canonical: 'https://lambking.store/creator-partner/',
    },
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
  const page = SITE.creatorPartnerEnabled && isCreatorPartnerPath() ? 'creatorPartner' : 'home'
  const meta = META[page][l]
  document.documentElement.lang = l
  document.title = meta.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.canonical)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description)
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', meta.canonical)
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', l === 'de' ? 'de_DE' : 'en_US')
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.title)
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', meta.description)
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
