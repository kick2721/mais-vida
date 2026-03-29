// app/page.tsx
import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import HeroSection from '@/app/components/sections/HeroSection'
import BenefitsSection from '@/app/components/sections/BenefitsSection'
import HowItWorksSection from '@/app/components/sections/HowItWorksSection'
import AffiliatesSection from '@/app/components/sections/AffiliatesSection'
import ClinicGallerySection from '@/app/components/sections/ClinicGallerySection'
import LocationSection from '@/app/components/sections/LocationSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <ClinicGallerySection />
        <HowItWorksSection />
        <AffiliatesSection />
        <LocationSection />
      </main>
      <Footer />
    </>
  )
}
