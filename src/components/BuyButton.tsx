import { trackAmazonClick, isMiddleClick } from '@/data/analytics'
import type { Book } from '@/data/books'
import { editionsOf } from '@/data/editions'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

export default function BuyButton({ book, size = 'md', preferredLanguage, label }: { book: Book; size?: 'md' | 'lg'; preferredLanguage?: string; label?: string }) {
  const lang = useLang()
  const t = textsFor(lang)
  const width = size === 'lg' ? 'max-w-[305px]' : 'max-w-[240px]'
  const editions = editionsOf(book).filter((item) => item.amazon.startsWith('https://'))
  const edition = preferredLanguage
    ? editions.find((item) => item.language === preferredLanguage)
    : editions.find((item) => item.language === lang)
      ?? editions.find((item) => item.language === book.lang)
      ?? editions[0]
  // Kein gültiger Amazon-Link → kein kaputter Button
  if (!edition) return null
  return (
    <a
      href={edition.amazon}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAmazonClick(book.id, edition.language)}
      onAuxClick={(event) => isMiddleClick(event) && trackAmazonClick(book.id, edition.language)}
      className={`block w-full ${width} transition-transform hover:scale-[1.03] focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60`}
      aria-label={`${book.title} – ${label ?? t.books.buyAmazon}`}
    >
      <img src="images/buttons/amazon.webp" alt={label ?? t.books.buyAmazon} className="h-auto w-full" />
    </a>
  )
}
