'use client';

import {
  LEDGER_STORY_STEPS,
  getLedgerStateAtStep,
} from '../config/ledgerStory';
import { WELCOME_SECTION_IDS } from '../config/sections';
import { useScrollStory } from '../model/useScrollStory';
import { LedgerPreview } from './LedgerPreview';
import styles from './welcome.module.css';

export const LedgerStorySection = () => {
  const { activeStep, setStepRef } = useScrollStory(LEDGER_STORY_STEPS.length);
  const state = getLedgerStateAtStep(activeStep);

  return (
    <section
      id={WELCOME_SECTION_IDS.ledger}
      className={`${styles.section} ${styles.bandDark}`}
      aria-labelledby="ledger-story-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>가계부</p>
        <h2 id="ledger-story-title" className={styles.sectionTitle}>
          스크롤할수록 한 달이 쌓입니다
        </h2>
        <p className={styles.sectionLead}>
          월급이 들어오고, 지출이 빠지고, 저축이 모이면 남은 예산이 바뀝니다.
        </p>

        <div className={styles.storyLayout}>
          <div className={styles.storySticky}>
            <LedgerPreview state={state} />
            <ol className={styles.storyDots} aria-hidden>
              {LEDGER_STORY_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className={`${styles.storyDot} ${
                    index === activeStep ? styles.storyDotActive : ''
                  }`}
                />
              ))}
            </ol>
          </div>
          <div className={styles.storySteps}>
            {LEDGER_STORY_STEPS.map((step, index) => (
              <article
                key={step.id}
                ref={setStepRef(index)}
                className={`${styles.storyStep} ${
                  index === activeStep ? styles.storyStepActive : ''
                }`}
                aria-current={index === activeStep ? 'step' : undefined}
              >
                <p className={styles.stepIndex}>
                  {String(index + 1).padStart(2, '0')}
                </p>
                {step.figure ? (
                  <p className={styles.stepFigure}>{step.figure}</p>
                ) : null}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
