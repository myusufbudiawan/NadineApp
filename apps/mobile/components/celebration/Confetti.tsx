import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

type Piece = {
  x: number;
  size: number;
  color: string;
  shape: 'strip' | 'dot' | 'petal';
  sway: number;
  spin: number;
  duration: number;
  delay: number;
};

// Deterministic-per-mount randomness is fine here; this only needs to look
// scattered, not reproducible.
function makePieces(count: number, width: number, palette: readonly string[], waves: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const wave = i % waves;
    return {
      x: Math.random() * width,
      size: 6 + Math.random() * 7,
      color: palette[i % palette.length],
      shape: (['strip', 'dot', 'petal'] as const)[i % 3],
      sway: (Math.random() - 0.5) * 70,
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
      duration: 2800 + Math.random() * 1800,
      delay: wave * 1100 + Math.random() * 700,
    };
  });
}

// Plain Animated (no reanimated/lottie installed): each piece gets one 0→1
// progress value driving its fall, a gentle side-to-side drift, a spin, and a
// fade on landing — all on the native driver so it stays smooth over a busy
// screen.
export function Confetti({
  palette,
  count = 48,
  waves = 1,
}: {
  palette: readonly string[];
  count?: number;
  waves?: number;
}) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(count, width, palette, waves), [count, width, palette, waves]);
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = pieces.map((piece, i) =>
      Animated.timing(progress[i], {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.bezier(0.25, 0.1, 0.45, 1),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, [pieces, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => {
        const p = progress[i];
        const dims =
          piece.shape === 'strip'
            ? { width: piece.size * 0.45, height: piece.size * 1.6, borderRadius: 1 }
            : piece.shape === 'dot'
              ? { width: piece.size * 0.8, height: piece.size * 0.8, borderRadius: piece.size }
              : { width: piece.size, height: piece.size * 0.6, borderRadius: piece.size, borderTopLeftRadius: 0 };
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: piece.x,
              top: -30,
              backgroundColor: piece.color,
              ...dims,
              opacity: p.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, height + 60] }) },
                {
                  translateX: p.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0, piece.sway, 0, -piece.sway, 0],
                  }),
                },
                { rotate: p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
