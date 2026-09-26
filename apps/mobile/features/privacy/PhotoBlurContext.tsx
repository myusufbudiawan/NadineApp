import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { loadPhotoBlurred, savePhotoBlurred } from './photoBlur';

type PhotoBlurContextValue = { blurred: boolean; toggleBlurred: () => void };

const PhotoBlurContext = createContext<PhotoBlurContextValue>({
  blurred: false,
  toggleBlurred: () => {},
});

// Mounted once at the app root (app/_layout.tsx) — one switch that blurs
// the baby's photo everywhere it's shown (Home's hero card, a milestone
// celebration, ...) rather than a per-screen setting parents would have to
// repeat when handing the phone to someone.
export function PhotoBlurProvider({ children }: { children: ReactNode }) {
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    loadPhotoBlurred()
      .then(setBlurred)
      .catch(() => {});
  }, []);

  const toggleBlurred = useCallback(() => {
    setBlurred((prev) => {
      const next = !prev;
      savePhotoBlurred(next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <PhotoBlurContext.Provider value={{ blurred, toggleBlurred }}>
      {children}
    </PhotoBlurContext.Provider>
  );
}

export function usePhotoBlur(): PhotoBlurContextValue {
  return useContext(PhotoBlurContext);
}
