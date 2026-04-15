export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import HeroSection from '@/app/components/sections/HeroSection'
import BenefitsSection from '@/app/components/sections/BenefitsSection'
import HowItWorksSection from '@/app/components/sections/HowItWorksSection'
import AffiliatesSection from '@/app/components/sections/AffiliatesSection'
import ClinicGallerySection from '@/app/components/sections/ClinicGallerySection'
import FaqSection from '@/app/components/sections/FaqSection'
import LocationSection from '@/app/components/sections/LocationSection'
import RefCapture from '@/app/components/RefCapture'

export default function HomePage() {
  return (
    <>
      <Suspense><RefCapture /></Suspense>
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <ClinicGallerySection />
        <HowItWorksSection />
        <AffiliatesSection />
        <FaqSection />
        <LocationSection />
      </main>
      <Footer />
    </>
  )
}
