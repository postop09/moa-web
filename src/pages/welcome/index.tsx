import { CalendarGuideSection } from './ui/CalendarGuideSection';
import { FactsBand } from './ui/FactsBand';
import { FeatureGridSection } from './ui/FeatureGridSection';
import { HeroSection } from './ui/HeroSection';
import { HighlightsSection } from './ui/HighlightsSection';
import { LedgerStorySection } from './ui/LedgerStorySection';
import { PwaGuideSection } from './ui/PwaGuideSection';
import { SharedLedgerSection } from './ui/SharedLedgerSection';
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
        <SharedLedgerSection />
        <CalendarGuideSection />
        <PwaGuideSection />
        <FactsBand />
        <WelcomeCta />
      </main>
    </div>
  );
};
