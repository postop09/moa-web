/** 이메일의 @ 앞부분만 보여준다. 담당자가 없으면 '미지정'. */
export const getAssigneeName = (email: string | null): string => {
  if (!email) return '미지정';

  const [name] = email.split('@');

  return name || email;
};
