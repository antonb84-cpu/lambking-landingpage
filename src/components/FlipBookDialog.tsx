import { useEffect, useState } from 'react'
import FlipBook from '@/components/FlipBook'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BOOKS } from '@/data/books'
import { flipLanguagesFor, flipPagesFor, flipTotalFor } from '@/data/flipbooks'
import { useLang } from '@/data/lang'
import { OPEN_BOOK_EVENT, OPEN_FLIP_EVENT } from '@/data/openBook'
import { textsFor } from '@/data/texts'

// Großes Fenster mit dem blätterbaren Buch (Leseprobe). Geöffnet wird es von den Buchkarten und dem Blätterbuch-Bereich.
export default function FlipBookDialog() {
  const lang = useLang()
  const t = textsFor(lang).tryit
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    const onOpen = (event: Event) => setId(String((event as CustomEvent).detail ?? '') || null)
    window.addEventListener(OPEN_FLIP_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_FLIP_EVENT, onOpen)
  }, [])

  const book = BOOKS.find((item) => item.id === id) ?? null
  const first = book ? flipLanguagesFor(book.id)[0] : undefined
  const count = book && first ? flipPagesFor(book.id, first)?.length ?? 0 : 0
  const total = book && first ? flipTotalFor(book.id, first) ?? count : 0

  return (
    <Dialog open={!!book} onOpenChange={(open) => !open && setId(null)}>
      <DialogContent
        className="max-h-[96vh] w-[96vw] max-w-[1160px] overflow-y-auto rounded-2xl border-2 bg-background p-4 sm:p-6"
        closeButtonClassName="right-3 top-3 flex size-11 items-center justify-center rounded-full border border-primary/15 bg-white opacity-100 shadow-lg"
        closeButtonIconClassName="size-6"
      >
        {book ? (
          <>
            <DialogHeader className="pr-12 text-left">
              <DialogTitle className="font-display text-xl font-semibold leading-tight sm:text-2xl">{book.title}</DialogTitle>
              <DialogDescription className="text-sm">
                {t.previewOnly.replace('{count}', String(count)).replace('{total}', String(total))}
                {' · '}
                <button
                  type="button"
                  onClick={() => {
                    setId(null)
                    window.dispatchEvent(new CustomEvent(OPEN_BOOK_EVENT, { detail: book.id }))
                  }}
                  className="font-bold text-primary underline underline-offset-4"
                >
                  {t.details}
                </button>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <FlipBook key={`${book.id}-${lang}`} book={book} size="dialog" />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
