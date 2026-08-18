'use client';

import { useEffect } from 'react';

import { persistAuthGateReadyCookie } from '../model/authGateCookieActions';

export const AuthGateCookieSync = () => {
  useEffect(() => {
    void persistAuthGateReadyCookie();
  }, []);

  return null;
};
