type IosNavigator = Navigator & {
  standalone?: boolean;
};

export const isStandalone = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isDisplayStandalone = window.matchMedia(
    '(display-mode: standalone)',
  ).matches;
  const isIosStandalone =
    (window.navigator as IosNavigator).standalone === true;

  return isDisplayStandalone || isIosStandalone;
};
