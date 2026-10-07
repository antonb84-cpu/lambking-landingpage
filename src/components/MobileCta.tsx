import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Schmaler fester Knopf am Handy: erscheint, sobald das Titelbild verlassen ist, und verschwindet, wenn
// die Bücher oder das Ende der Seite im Bild sind (dort wäre er überflüssig).
export default function MobileCta() {
  const t = textsFor(useLang())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const top = document.getElementById('top')?.getBoundingClientRect()
      const books = document.getElementById('buecher')?.getBoundingClientRect()
      const faq = document.getElementById('faq')?.getBoundingClientRect()
      const height = window.innerHeight
      const heroGone = !top || top.bottom < height * 0.15
      const booksInView = !!books && books.top < height * 0.75 && books.bottom > height * 0.25
      const nearEnd = !!faq && faq.top < height * 0.6
      setVisible(heroGone && !booksInView && !nearEnd)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-3 pt-2 transition-transform duration-300 md:hidden ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!visible}
    >
      <a
        href="#buecher"
        tabIndex={visible ? 0 : -1}
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-xl shadow-primary/30"
      >
        <BookOpen className="h-5 w-5" aria-hidden />
        {t.hero.ctaBooks}
      </a>
    </div>
  )
}
