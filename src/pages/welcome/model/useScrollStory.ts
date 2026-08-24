'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useScrollFrame } from './useScrollFrame';

export const useScrollStory = (stepCount: number) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const nodesRef = useRef<Array<Element | null>>(Array(stepCount).fill(null));

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduceMotion(media.matches);
    };

    sync();
    media.addEventListener('change', sync);

    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  const setStepRef = useCallback((index: number) => {
    return (node: Element | null) => {
      nodesRef.current[index] = node;
    };
  }, []);

  useScrollFrame(() => {
    if (reduceMotion) {
      return;
    }

    const focusLine = window.innerHeight * 0.45;
    let nextStep = 0;

    nodesRef.current.forEach((node, index) => {
      if (!node) {
        return;
      }

      if (node.getBoundingClientRect().top <= focusLine) {
        nextStep = index;
      }
    });

    setActiveStep((current) => (current === nextStep ? current : nextStep));
  });

  const resolvedStep = reduceMotion ? Math.max(0, stepCount - 1) : activeStep;

  return { activeStep: resolvedStep, setStepRef, reduceMotion };
};
