import { useEffect } from 'react'
import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import UspBand from '@/sections/UspBand'
import Mascot from '@/sections/Mascot'
import TryIt from '@/sections/TryIt'
import MobileCta from '@/components/MobileCta'
import FlipBookDialog from '@/components/FlipBookDialog'
import Family from '@/sections/Family'
import Shop from '@/sections/Shop'
import ProductPage from '@/sections/ProductPage'
import AppSection from '@/sections/AppSection'
import Donate from '@/sections/Donate'
import SupportedWorks from '@/sections/SupportedWorks'
import CreatorPartnerTeaser from '@/sections/CreatorPartnerTeaser'
import Faq from '@/sections/Faq'
import Contact from '@/sections/Contact'
import Footer from '@/sections/Footer'
import { trackPageView } from '@/data/analytics'
import CreatorPartnerPage from '@/pages/CreatorPartnerPage'
import { isCreatorPartnerPath } from '@/data/routes'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { BOOKS, SITE } from '@/data/books'
import { bookIdFromLocation, bookPath, isBookPath } from '@/data/bookLink'
import CounterSelfTest from '@/components/CounterSelfTest'

export default function App() {
  const t = textsFor(useLang())

  useEffect(() => {
    trackPageView()
  }, [])

  if (SITE.creatorPartnerEnabled && isCreatorPartnerPath()) {
    return <CreatorPartnerPage />
  }

  // Eigene Produktseite je Buch (buch/<name>/); der alte Link ?buch=<id> führt dorthin weiter
  const linkedBook = BOOKS.find((book) => book.id === bookIdFromLocation())
  if (linkedBook && !isBookPath()) {
    window.location.replace(bookPath(linkedBook))
    return null
  }
  if (linkedBook) {
    return (
      <div className="min-h-screen">
        <Header />
        <ProductPage book={linkedBook} />
        <Footer />
        <FlipBookDialog />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Skip-Link für Tastaturnutzer */}
      <a
        href="#buecher"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:font-bold focus:text-primary-foreground"
      >
        {t.a11y.skipToContent}
      </a>
      <Header />
      <main id="inhalt">
        <Hero />
        <Shop />
        <UspBand />
        {!SITE.hiddenSections.includes('app') && <AppSection />}
        {!SITE.hiddenSections.includes('tryit') && <TryIt />}
        <Family />
        <Mascot />
        {!SITE.hiddenSections.includes('supportedWorks') && <SupportedWorks />}
        {SITE.creatorPartnerEnabled ? <CreatorPartnerTeaser /> : null}
        <Donate />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <MobileCta />
      <FlipBookDialog />
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('zaehler-test') ? <CounterSelfTest /> : null}
    </div>
  )
}
