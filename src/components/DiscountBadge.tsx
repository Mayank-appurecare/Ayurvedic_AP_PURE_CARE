import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

export function DiscountBadge({ percent, style }: { percent: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!percent) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{percent}% OFF</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  badge: {
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: spacing.xxs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.tiny,
    color: colors.discount,
    fontWeight: '700',
  },
});
