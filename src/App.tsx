import { useEffect } from 'react'
import HeroSection from './sections/HeroSection'
import AboutSection from './sections/AboutSection'
import ProjectsSection from './sections/ProjectsSection'
import ExperienceSection from './sections/ExperienceSection'
import SkillsSection from './sections/SkillsSection'
import ContactSection from './sections/ContactSection'
import StorySection from './sections/StorySection'
import ContentsSection from './sections/ContentsSection'
import QuoteSection from './sections/QuoteSection'
import EditorialChrome from './components/EditorialChrome'
import SiteHeader from './components/SiteHeader'
import ScrollProgress from './components/ScrollProgress'
import { initSpotlight } from './effects/spotlight'
import Preloader from './components/Preloader'
import CursorFollower from './components/CursorFollower'
import TechMarquee from './components/TechMarquee'
import StarfieldBackground from './components/StarfieldBackground'
import InkCanvas from './components/InkCanvas'
import { StoryModalProvider } from './components/StoryModal'
import { initCloth } from './effects/cloth'
import { LanguageProvider } from './i18n/LanguageContext'
import { CommandProvider } from './components/SiteCommand'

export default function App() {
  useEffect(() => initCloth(), [])
  useEffect(() => initSpotlight(), [])

  return (
    <LanguageProvider>
    <StoryModalProvider>
    <CommandProvider>
      <StarfieldBackground />
      {/* 外层主容器：透明，让固定在底层的星空透出来；html/body/#root 仍是 #0C0C0C */}
      <ScrollProgress />
      <SiteHeader />
      <main className="relative z-[1] min-h-screen font-sans" style={{ overflowX: 'clip' }}>
        <HeroSection />
        <ContentsSection />
        <AboutSection />
        <TechMarquee />
        <ProjectsSection />
        <QuoteSection />
        <ExperienceSection />
        <SkillsSection />
        <StorySection />
        <ContactSection />
      </main>
      <EditorialChrome />
      <InkCanvas />
      <CursorFollower />
      <Preloader />
    </CommandProvider>
    </StoryModalProvider>
    </LanguageProvider>
  )
}
