import { supabase } from './client';

const BUCKET = 'baby-photos';
// Signed URLs are cached in-memory only; nothing here is persisted, so a
// cold app start always re-signs before rendering a photo.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 1 day

/**
 * The object path for a baby's photo — a fixed name per baby (overwritten
 * on every re-upload via `upsert`) so the DB only ever needs to remember
 * one path, and RLS policies can join `split_part(name, '/', 1)::uuid`
 * back to `babies.id` (see migration 003_baby_photo_storage.sql).
 */
export function babyPhotoPath(babyId: string): string {
  return `${babyId}/avatar.jpg`;
}

/**
 * Uploads a locally-picked photo (a `file://` URI from expo-image-picker)
 * to Supabase Storage and returns the object path to persist as
 * `BabyProfile.photoUri`. Requires the baby to already exist server-side
 * (RLS checks `babies.user_id = auth.uid()` for the given baby id).
 */
export async function uploadBabyPhoto(babyId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const path = babyPhotoPath(babyId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Resolves a stored object path to a short-lived signed URL for display.
 * Returns undefined (rather than throwing) if the viewer has no access or
 * the object doesn't exist yet, so callers can fall back to a placeholder.
 */
export async function getBabyPhotoUrl(path: string | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  // Already a usable URL (e.g. a stale local file:// URI from before this
  // feature existed) — nothing to sign.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('file://')) return undefined;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return undefined;
  return data.signedUrl;
}
