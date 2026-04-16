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
import SectionDivider from '@/app/components/ui/SectionDivider'

export default function HomePage() {
  return (
    <>
      <Suspense><RefCapture /></Suspense>
      <div className="deco-orbs" aria-hidden>
        <div className="deco-orb" style={{ width: 500, height: 500, top: '-120px', right: '-100px', background: 'radial-gradient(circle, rgba(106,173,94,0.30), transparent 70%)' }} />
        <div className="deco-orb" style={{ width: 380, height: 380, top: '40%', left: '-120px', background: 'radial-gradient(circle, rgba(184,150,12,0.20), transparent 70%)', animationDelay: '-6s' }} />
        <div className="deco-orb" style={{ width: 520, height: 520, bottom: '-180px', right: '20%', background: 'radial-gradient(circle, rgba(74,140,63,0.25), transparent 70%)', animationDelay: '-12s' }} />
      </div>
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <BenefitsSection />
        {/* dark → light */}
        <div aria-hidden style={{ height: 100, background: 'linear-gradient(to bottom, #1a350f 0%, #f5f9f3 100%)', marginBottom: '-2px' }} />
        <ClinicGallerySection />
        {/* light → dark */}
        <div aria-hidden style={{ height: 100, background: 'linear-gradient(to bottom, #f5f9f3 0%, #112209 100%)', marginTop: '-2px' }} />
        <HowItWorksSection />
        <AffiliatesSection />
        <FaqSection />
        {/* dark → light */}
        <div aria-hidden style={{ height: 100, background: 'linear-gradient(to bottom, #112209 0%, #f5f9f3 100%)', marginBottom: '-2px' }} />
        <LocationSection />
        {/* light → dark footer */}
        <div aria-hidden style={{ height: 80, background: 'linear-gradient(to bottom, #f5f9f3 0%, #1a1a1a 100%)', marginTop: '-2px' }} />
      </main>
      <Footer />
    </>
  )
}
