import { supabase } from './client';

const BUCKET = 'baby-photos';
// Signed URLs are cached in-memory only; nothing here is persisted, so a
// cold app start always re-signs before rendering a photo.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 1 day
// Re-sign a bit before actual expiry so a URL already in flight (e.g. an
// <Image> mid-download) never gets cut off by the bucket rejecting it.
const SIGNED_URL_REFRESH_MARGIN_MS = 5 * 60 * 1000;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * The object path for a baby's photo — a fixed name per baby (overwritten
 * on every re-upload via `upsert`) so the DB only ever needs to remember
 * one path, and RLS policies can join `split_part(name, '/', 1)::uuid`
 * back to `babies.id` (see migration 003_baby_photo_storage.sql).
 */
export function babyPhotoPath(babyId: string): string {
  return `${babyId}/avatar.jpg`;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// React Native has no built-in atob/Buffer, and fetch(file://...).arrayBuffer()
// silently corrupts binary data on-device — so decode expo-image-picker's
// base64 output ourselves rather than relying on either.
function decodeBase64(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Uploads a locally-picked photo (base64 from expo-image-picker's
 * `base64: true` option) to Supabase Storage and returns the value to
 * persist as `BabyProfile.photoUri`. Requires the baby to already exist
 * server-side (RLS checks `babies.user_id = auth.uid()` for the given baby
 * id).
 */
export async function uploadBabyPhoto(babyId: string, base64: string): Promise<string> {
  const path = babyPhotoPath(babyId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, decodeBase64(base64), {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  // The object path is stable across re-uploads (upsert), so returning it
  // as-is would leave `BabyProfile.photoUri` unchanged — and both
  // useBabyPhotoUrl's effect (keyed on that value) and <Image>'s own cache
  // (keyed on the resolved URL) treat "unchanged" as "nothing to re-fetch",
  // so the old photo would keep showing until something else (an app
  // restart) forced a re-resolve. Tag on the upload time so the stored
  // value always changes; getBabyPhotoUrl strips it back off.
  signedUrlCache.delete(path);
  return `${path}?v=${Date.now()}`;
}

/**
 * Resolves a stored object path to a short-lived signed URL for display,
 * reusing an in-memory cached URL when one hasn't expired yet — signing is
 * a network call, and callers like `useBabyPhotoUrl` re-resolve on every
 * mount (e.g. switching tabs), so without this every tab switch would hit
 * Storage again for a URL that's still perfectly valid.
 * Returns undefined (rather than throwing) if the viewer has no access or
 * the object doesn't exist yet, so callers can fall back to a placeholder.
 */
export async function getBabyPhotoUrl(path: string | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  // Already a usable URL (e.g. a stale local file:// URI from before this
  // feature existed) — nothing to sign.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('file://')) return undefined;
  // Offline-only build: the photo is stored inline in the profile.
  if (path.startsWith('data:')) return path;

  // Strip the `?v=...` cache-busting tag uploadBabyPhoto appends — it's only
  // there to change the stored value on re-upload, not part of the object path.
  const objectPath = path.split('?')[0];

  const cached = signedUrlCache.get(objectPath);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return undefined;
  signedUrlCache.set(objectPath, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000 - SIGNED_URL_REFRESH_MARGIN_MS,
  });
  return data.signedUrl;
}
