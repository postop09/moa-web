import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_BUCKET } from '../config/tableName';
import type { GetAttachmentUrlsRes } from '../model/getAttachmentUrlsRes';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const getAttachmentUrls = async (
  supabase: SupabaseClient,
  paths: string[],
): Promise<GetAttachmentUrlsRes> => {
  if (paths.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(INQUIRY_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  const urlByPath = new Map<string, string>();
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl);
  });

  return paths.map((path) => ({ path, url: urlByPath.get(path) ?? null }));
};
