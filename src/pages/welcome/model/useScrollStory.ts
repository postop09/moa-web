'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const useScrollStory = (stepCount: number) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [attachedCount, setAttachedCount] = useState(0);
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
      const previous = nodesRef.current[index];
      nodesRef.current[index] = node;

      if (Boolean(previous) === Boolean(node)) {
        return;
      }

      setAttachedCount(nodesRef.current.filter((item) => item !== null).length);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || attachedCount === 0) {
      return;
    }

    const nodes = nodesRef.current.filter(
      (node): node is Element => node !== null,
    );

    if (nodes.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];

        if (!top) {
          return;
        }

        const index = nodesRef.current.indexOf(top.target);

        if (index >= 0) {
          setActiveStep(index);
        }
      },
      {
        root: null,
        rootMargin: '-28% 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [attachedCount, reduceMotion, stepCount]);

  const resolvedStep = reduceMotion ? Math.max(0, stepCount - 1) : activeStep;

  return { activeStep: resolvedStep, setStepRef, reduceMotion };
};
