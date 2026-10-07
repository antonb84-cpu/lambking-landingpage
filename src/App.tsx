import { useEffect } from 'react'
import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import UspBand from '@/sections/UspBand'
import Mascot from '@/sections/Mascot'
import TryIt from '@/sections/TryIt'
import Groups from '@/sections/Groups'
import MobileCta from '@/components/MobileCta'
import FlipBookDialog from '@/components/FlipBookDialog'
import Family from '@/sections/Family'
import Books from '@/sections/Books'
import AppSection from '@/sections/AppSection'
import Donate from '@/sections/Donate'
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
import CounterSelfTest from '@/components/CounterSelfTest'

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
        <UspBand />
        <Books />
        {!SITE.hiddenSections.includes('tryit') && <TryIt />}
        {!SITE.hiddenSections.includes('groups') && <Groups />}
        <Family />
        <Donate />
        <Mascot />
        {!SITE.hiddenSections.includes('app') && <AppSection />}
        {!SITE.hiddenSections.includes('supportedWorks') && <SupportedWorks />}
        {SITE.creatorPartnerEnabled ? <CreatorPartnerTeaser /> : null}
        <Faq />
      </main>
      <Footer />
      <MobileCta />
      <FlipBookDialog />
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('zaehler-test') ? <CounterSelfTest /> : null}
    </div>
  )
}
