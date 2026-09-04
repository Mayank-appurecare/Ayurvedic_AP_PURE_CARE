import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  color?: string;
}

export function RatingStars({ rating, size = 14, showValue = false, reviewCount, color }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const starColor = color ?? colors.star;
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {stars.map((s) => {
          const filled = rating >= s;
          const half = !filled && rating >= s - 0.5;
          return (
            <Ionicons
              key={s}
              name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
              size={size}
              color={filled || half ? starColor : colors.starEmpty}
              style={{ marginRight: 1 }}
            />
          );
        })}
      </View>
      {showValue && <Text style={styles.value}>{rating.toFixed(1)}</Text>}
      {reviewCount !== undefined && <Text style={styles.count}>({reviewCount.toLocaleString('en-IN')})</Text>}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  stars: { flexDirection: 'row' },
  value: { ...typography.captionMedium, color: colors.textPrimary },
  count: { ...typography.caption, color: colors.textMuted },
});
