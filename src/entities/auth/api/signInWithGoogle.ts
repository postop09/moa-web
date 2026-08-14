import { createBrowserClient } from '@/shared/api';

export const signInWithGoogle = async (next?: string | null) => {
  const supabase = createBrowserClient();
  const redirectTo = new URL(`${window.location.origin}/auth/callback`);

  if (next) {
    redirectTo.searchParams.set('next', next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo.toString() },
  });

  if (error) {
    throw error;
  }

  return data;
};
