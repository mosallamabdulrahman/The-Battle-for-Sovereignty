import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import HowToPlaySection from '../components/HowToPlaySection';
import CategoriesSection from '../components/CategoriesSection';
import GameSetupSection from '../components/GameSetupSection';
import ScrollToTop from '../components/ScrollToTop';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden" suppressHydrationWarning>
      {/* Dynamic Sticky Header */}
      <Header />

      {/* Main Sections Body */}
      <main className="flex-grow">
        {/* Zero-padding Hero Section for beautiful blending */}
        <HeroSection />

        {/* Dynamic Horizontal Instructions */}
        <HowToPlaySection />

        {/* Dynamic Quiz Categories Screen */}
        <CategoriesSection />

        {/* Tactical Game Setup Panel before Footer */}
        <GameSetupSection />
      </main>

      {/* Scroll to Top floating utility */}
      <ScrollToTop />

      {/* Footer component */}
      <Footer />
    </div>
  );
}

