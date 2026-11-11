import { BookOpen, CheckCircle2, Languages, Palette, ScrollText } from 'lucide-react'
import { CATEGORIES, type Book } from '@/data/books'
import { coverFor } from '@/data/covers'
import { editionsOf } from '@/data/editions'
import { textsFor } from '@/data/texts'

// Gemeinsame Helfer für Bücherbereich, Shop-Raster und Produktseite (keine Komponenten).
// Kategorie-Helfer (Labels/Typen kommen aus den Buchdaten, sprachabhängig)
export const catDefOf = (id: string) => CATEGORIES.find((c) => c.id === id)
export const typeLabelOf = (b: Book, lang: 'de' | 'en'): string => {
  const c = catDefOf(b.category)
  return c ? (lang === 'en' ? c.typeEn : c.typeDe) : b.category
}
export const catLabelOf = (id: string, lang: 'de' | 'en'): string => {
  const c = catDefOf(id)
  return c ? (lang === 'en' ? c.labelEn : c.labelDe) : id
}


export type BooksCopy = ReturnType<typeof textsFor>['books']
const editionCopyOverrides: Record<string, Partial<BooksCopy>> = {
  es: {
    seePrice: 'Consultar el precio actual en Amazon', samplesHint: 'Mira el interior – haz clic para ampliar',
    samplePage: 'Página de muestra', enlargedSamplePage: 'página de muestra ampliada', zoom: 'Ampliar',
    backToBook: 'Volver al libro', previousPage: 'Página anterior', nextPage: 'Página siguiente', page: 'Página',
    buyAmazon: 'Ver en Amazon', availableLanguages: 'Disponible en',
    bookInfoTitle: 'Datos del libro', mediaGallery: 'Galería del libro', mediaCover: 'Portada',
    mediaLifestyle: 'Foto del libro (imagen ilustrativa)', mediaVideo: 'Reproducir vídeo del libro',
    mediaSwipeHint: 'Desliza o usa las flechas', previousImage: 'Imagen anterior', nextImage: 'Imagen siguiente',
    coloringFactsTitle: 'Qué contiene cada libro para colorear de LambKing',
    coloringFacts: ['Mínimo 70 páginas', 'Tamaño aprox. DIN A4', 'Fiel a la Biblia', 'Además, 5 páginas con juegos, preguntas y pasatiempos', 'Disponible en varios idiomas'],
    coloringAge: 'A partir de 6 años', coloringFormat: 'Mínimo 70 páginas · aprox. DIN A4',
    amazonPending: 'Aún no hay un enlace de Amazon para esta edición. El botón de compra aparecerá cuando se añada en la administración.',
  },
  ro: {
    seePrice: 'Vezi prețul actual pe Amazon', samplesHint: 'Răsfoiește cartea – apasă pentru a mări',
    samplePage: 'Pagină de prezentare', enlargedSamplePage: 'pagină de prezentare mărită', zoom: 'Mărește',
    backToBook: 'Înapoi la carte', previousPage: 'Pagina anterioară', nextPage: 'Pagina următoare', page: 'Pagina',
    buyAmazon: 'Vezi pe Amazon', availableLanguages: 'Disponibilă în',
    bookInfoTitle: 'Pe scurt despre carte', mediaGallery: 'Galeria cărții', mediaCover: 'Copertă',
    mediaLifestyle: 'Fotografie a cărții (imagine ilustrativă)', mediaVideo: 'Redă videoclipul cărții',
    mediaSwipeHint: 'Glisează sau folosește săgețile', previousImage: 'Imaginea precedentă', nextImage: 'Imaginea următoare',
    coloringFactsTitle: 'Ce conține fiecare carte de colorat LambKing',
    coloringFacts: ['Minimum 70 de pagini', 'Mărime aprox. DIN A4', 'Fidelă Bibliei', 'În plus, 5 pagini cu jocuri, întrebări și puzzle-uri', 'Disponibilă în mai multe limbi'],
    coloringAge: 'De la 6 ani', coloringFormat: 'Minimum 70 de pagini · aprox. DIN A4',
    amazonPending: 'Nu există încă un link Amazon pentru această ediție. Butonul de cumpărare va apărea după adăugarea linkului în administrare.',
  },
}

export const booksCopyForEdition = (siteLanguage: 'de' | 'en', editionLanguage: string | null): BooksCopy => {
  if (editionLanguage === 'de' || editionLanguage === 'en') return textsFor(editionLanguage).books
  return { ...textsFor(siteLanguage).books, ...(editionLanguage ? editionCopyOverrides[editionLanguage] : {}) }
}

export const localizedBook = (book: Book, language: string): Book => {
  const edition = editionsOf(book).find((item) => item.language === language)
  if (!edition) return book
  return {
    ...book,
    title: edition.title || book.title,
    series: edition.series || book.series,
    age: edition.age || book.age,
    detail: edition.detail || book.detail,
    description: edition.description || book.description,
    highlights: edition.highlights?.length ? edition.highlights : book.highlights,
    samples: edition.samples?.length ? edition.samples : book.samples,
    amazon: edition.amazon,
    cover: coverFor(book, edition).src,
    coverFront: undefined,
    coverSpread: coverFor(book, edition).spread,
    lifestyleImages: edition.lifestyleImages ?? (edition.language === book.lang ? book.lifestyleImages : []),
    previewVideo: edition.previewVideo ?? (edition.language === book.lang ? book.previewVideo : undefined),
  }
}

export function highlightIcon(text: string) {
  if (/bibelstelle|bible passage|pasaje|pasaj/i.test(text)) return ScrollText
  if (/seite|page|página|pagin/i.test(text)) return BookOpen
  if (/ausmal|color|colorear|colorat/i.test(text)) return Palette
  if (/sprach|language|idioma|limb/i.test(text)) return Languages
  return CheckCircle2
}

export const isColoringBook = (book: Book) => book.category === 'malbuecher'
