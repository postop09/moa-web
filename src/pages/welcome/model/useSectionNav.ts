'use client';

import { useEffect, useRef, useState } from 'react';

import type { WelcomeSection } from '../config/sections';
import { useScrollFrame } from './useScrollFrame';

export const useSectionNav = (sections: WelcomeSection[]) => {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const nodesRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    nodesRef.current = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null);
  }, [sections]);

  useScrollFrame(() => {
    const nodes = nodesRef.current;

    if (nodes.length === 0) {
      return;
    }

    const last = nodes[nodes.length - 1];
    const atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;

    if (atBottom && last?.id) {
      setActiveId((current) => (current === last.id ? current : last.id));
      return;
    }

    const header = document.querySelector('header');
    const headerHeight = header?.offsetHeight ?? 56;
    const focusLine = headerHeight + window.innerHeight * 0.25;
    let nextId = nodes[0]?.id ?? '';

    nodes.forEach((node) => {
      if (node.getBoundingClientRect().top <= focusLine) {
        nextId = node.id;
      }
    });

    if (!nextId) {
      return;
    }

    setActiveId((current) => (current === nextId ? current : nextId));
  });

  return { activeId };
};
