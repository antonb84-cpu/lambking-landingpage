import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import Books from '@/sections/Books'
import Trust from '@/sections/Trust'
import HowItWorks from '@/sections/HowItWorks'
import AppSection from '@/sections/AppSection'
import Donate from '@/sections/Donate'
import About from '@/sections/About'
import Faq from '@/sections/Faq'
import Footer from '@/sections/Footer'

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Skip-Link für Tastaturnutzer */}
      <a
        href="#buecher"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:font-bold focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt">
        <Hero />
        <Books />
        <Trust />
        <HowItWorks />
        <AppSection />
        <Donate />
        <About />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
