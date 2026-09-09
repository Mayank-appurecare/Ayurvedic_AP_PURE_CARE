import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const PARTICLE_COLOR_KEYS = [
  'primary',
  'accentGold',
  'success',
  'accentTerracotta',
  'star',
] as const;
const PARTICLE_COUNT = 10;

/**
 * A short one-shot burst of small particles radiating outward from wherever
 * this is rendered, then fading out. Mount it to play the animation;
 * unmount it (the caller clears its own "just applied" flag on a timer)
 * once it has finished — it never loops or replays on its own.
 */
export function ConfettiBurst() {
  const { colors } = useTheme();
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      15,
      particles.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [particles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((value, index) => {
        const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
        const distance = 24 + (index % 3) * 8;
        const translateX = value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance],
        });
        const translateY = value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance],
        });
        const opacity = value.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        const scale = value.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 0.4],
        });
        const colorKey = PARTICLE_COLOR_KEYS[index % PARTICLE_COLOR_KEYS.length];
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: colors[colorKey],
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
