// ─────────────────────────────────────────────────────────────
// Alle sichtbaren Texte der Landingpage – Deutsch & English
// Standardtexte liegen in texts.defaults.json. Änderungen aus dem
// Admin-Programm werden darübergelegt, ohne fehlende Felder zu löschen.
// ─────────────────────────────────────────────────────────────

import { SITE } from './books'
import type { Lang } from './lang'
import defaultTexts from './texts.defaults.json'

export const TEXTS = defaultTexts

export type Texts = (typeof TEXTS)['de']

type DeepPartial<T> = T extends Array<infer Item>
  ? Array<DeepPartial<Item>>
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T

type FrontendTextSettings = Partial<Record<Lang, DeepPartial<Texts>>>
type SiteWithFrontendTexts = typeof SITE & { frontendTexts?: FrontendTextSettings }

function mergeTexts<T>(defaults: T, saved: DeepPartial<T> | undefined): T {
  if (saved === undefined || saved === null) return defaults
  if (Array.isArray(defaults)) {
    return (Array.isArray(saved) ? saved : defaults) as T
  }
  if (typeof defaults !== 'object' || defaults === null || typeof saved !== 'object') {
    return saved as T
  }

  const result = { ...defaults } as Record<string, unknown>
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    const defaultValue = (defaults as Record<string, unknown>)[key]
    result[key] = mergeTexts(defaultValue, value as DeepPartial<typeof defaultValue>)
  }
  return result as T
}

export function textsFor(lang: Lang): Texts {
  const saved = (SITE as SiteWithFrontendTexts).frontendTexts?.[lang]
  return mergeTexts(TEXTS[lang], saved)
}
