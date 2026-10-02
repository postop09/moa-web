const FALLBACK = '운영자';

/** 이메일의 앞부분만 보여 준다. */
export const getEmailName = (email: string | null) => {
  const name = email?.split('@')[0]?.trim();

  return name ? name : FALLBACK;
};
