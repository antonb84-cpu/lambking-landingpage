// Winziger Kanal, mit dem das 3D-Buch im Hero den Vorschau-Dialog
// der Bücher-Sektion öffnet (kein Link, kein neuer Tab).

export const OPEN_BOOK_EVENT = 'lambking:open-book'

export function openBookById(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_BOOK_EVENT, { detail: id }))
}
