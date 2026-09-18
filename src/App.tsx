import { useEffect } from 'react'
import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import Books from '@/sections/Books'
import Trust from '@/sections/Trust'
import AppSection from '@/sections/AppSection'
import Donate from '@/sections/Donate'
import About from '@/sections/About'
import SupportedWorks from '@/sections/SupportedWorks'
import CreatorPartnerTeaser from '@/sections/CreatorPartnerTeaser'
import Faq from '@/sections/Faq'
import Footer from '@/sections/Footer'
import { trackPageView } from '@/data/analytics'
import CreatorPartnerPage from '@/pages/CreatorPartnerPage'
import { isCreatorPartnerPath } from '@/data/routes'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'
import { SITE } from '@/data/books'

export default function App() {
  const t = textsFor(useLang())

  useEffect(() => {
    trackPageView()
  }, [])

  if (SITE.creatorPartnerEnabled && isCreatorPartnerPath()) {
    return <CreatorPartnerPage />
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
        <Books />
        <Trust />
        <AppSection />
        <Donate />
        <About />
        <SupportedWorks />
        {SITE.creatorPartnerEnabled ? <CreatorPartnerTeaser /> : null}
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
