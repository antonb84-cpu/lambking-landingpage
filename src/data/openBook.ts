// Winziger Kanal, mit dem das 3D-Buch im Hero den Vorschau-Dialog
// der Bücher-Sektion öffnet (kein Link, kein neuer Tab).

export const OPEN_BOOK_EVENT = 'lambking:open-book'

export function openBookById(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_BOOK_EVENT, { detail: id }))
}

// Öffnet das große Blätterbuch (Leseprobe) eines Buches in einem Fenster.
export const OPEN_FLIP_EVENT = 'lambking:open-flip'

export function openFlipBookById(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_FLIP_EVENT, { detail: id }))
}
