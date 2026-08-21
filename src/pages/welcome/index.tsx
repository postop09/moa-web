import { CalendarGuideSection } from './ui/CalendarGuideSection';
import { FactsBand } from './ui/FactsBand';
import { FeatureGridSection } from './ui/FeatureGridSection';
import { HeroSection } from './ui/HeroSection';
import { HighlightsSection } from './ui/HighlightsSection';
import { LedgerStorySection } from './ui/LedgerStorySection';
import { PwaGuideSection } from './ui/PwaGuideSection';
import { WelcomeCta } from './ui/WelcomeCta';
import { WelcomeHeader } from './ui/WelcomeHeader';
import styles from './ui/welcome.module.css';

export const WelcomePage = () => {
  return (
    <div className={styles.page}>
      <WelcomeHeader />
      <main>
        <HeroSection />
        <HighlightsSection />
        <LedgerStorySection />
        <FeatureGridSection />
        <CalendarGuideSection />
        <PwaGuideSection />
        <FactsBand />
        <WelcomeCta />
      </main>
    </div>
  );
};
