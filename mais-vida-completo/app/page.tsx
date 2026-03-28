// app/page.tsx
// Landing page principal — agrega todas as secções

import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import HeroSection from '@/app/components/sections/HeroSection'
import BenefitsSection from '@/app/components/sections/BenefitsSection'
import HowItWorksSection from '@/app/components/sections/HowItWorksSection'
import AffiliatesSection from '@/app/components/sections/AffiliatesSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <HowItWorksSection />
        <AffiliatesSection />
      </main>
      <Footer />
    </>
  )
}
