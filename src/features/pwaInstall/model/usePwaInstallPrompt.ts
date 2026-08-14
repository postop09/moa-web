'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { PWA_INSTALL_DISMISSED_STORAGE_KEY } from '../config/storageKeys';
import { isIosDevice } from '../lib/isIosDevice';
import { isStandalone } from '../lib/isStandalone';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PwaInstallPlatform = 'ios' | 'installable' | 'manual';

const subscribeClient = () => () => {};

export const usePwaInstallPrompt = () => {
  const isClient = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const storedDismissed =
    isClient && localStorage.getItem(PWA_INSTALL_DISMISSED_STORAGE_KEY) === '1';
  const isInstalled = isClient && isStandalone();
  const isOpen = isClient && !isDismissed && !storedDismissed && !isInstalled;

  const dismiss = useCallback(() => {
    localStorage.setItem(PWA_INSTALL_DISMISSED_STORAGE_KEY, '1');
    setIsDismissed(true);
    setDeferredPrompt(null);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }, [deferredPrompt, dismiss]);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      if (
        localStorage.getItem(PWA_INSTALL_DISMISSED_STORAGE_KEY) === '1' ||
        isStandalone()
      ) {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      dismiss();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismiss, isClient]);

  const platform: PwaInstallPlatform = deferredPrompt
    ? 'installable'
    : isClient && isIosDevice()
      ? 'ios'
      : 'manual';

  return {
    isOpen,
    platform,
    dismiss,
    promptInstall,
  };
};
