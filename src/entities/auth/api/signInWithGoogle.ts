import { createBrowserClient } from '@/shared/api';

export const signInWithGoogle = async () => {
  const supabase = createBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) {
    throw error;
  }

  return data;
};
