export const isIosDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { userAgent, platform, maxTouchPoints } = window.navigator;
  const isIphoneOrIpod = /iPhone|iPod/i.test(userAgent);
  const isIpad =
    /iPad/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);

  return isIphoneOrIpod || isIpad;
};
