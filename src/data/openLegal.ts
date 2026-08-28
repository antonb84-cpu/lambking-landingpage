// Winziger Kanal, mit dem Header/Footer das Rechts-Fenster
// (Impressum/Datenschutz) öffnen – als Fenster auf derselben Seite,
// kein neuer Tab, kein Seitenwechsel nötig.

export const OPEN_LEGAL_EVENT = 'lambking:open-legal'

export type LegalKind = 'impressum' | 'datenschutz'

export function openLegal(kind: LegalKind) {
  window.dispatchEvent(new CustomEvent(OPEN_LEGAL_EVENT, { detail: kind }))
}
