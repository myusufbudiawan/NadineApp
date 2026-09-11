import { useEffect, useState } from 'react';
import { getBabyPhotoUrl } from '@/lib/supabase/storage';

// BabyProfile.photoUri holds a Supabase Storage object path (or, for
// profiles saved before this feature existed, a stale local file:// URI).
// Screens can't pass either straight into <Image source={{ uri }}> — a
// path needs signing, and a file:// URI is meaningless off-device — so
// this resolves it to a displayable URL, re-resolving whenever the stored
// value changes.
export function useBabyPhotoUrl(photoUri: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    if (!photoUri) {
      setUrl(undefined);
      return;
    }
    getBabyPhotoUrl(photoUri).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [photoUri]);

  return url;
}
