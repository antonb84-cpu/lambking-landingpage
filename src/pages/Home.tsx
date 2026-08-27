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

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
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
