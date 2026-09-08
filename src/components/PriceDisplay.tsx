import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { formatPrice } from '../utils/format';

interface Props {
  price: number;
  mrp?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscountLabel?: boolean;
}

export function PriceDisplay({ price, mrp, size = 'md', showDiscountLabel = false }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasDiscount = !!mrp && mrp > price;
  const discountPercent = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  return (
    <View style={styles.row}>
      <Text
        style={[styles.price, size === 'lg' && styles.priceLg, size === 'sm' && styles.priceSm]}
      >
        {formatPrice(price)}
      </Text>
      {hasDiscount && (
        <Text style={[styles.mrp, size === 'lg' && styles.mrpLg]} numberOfLines={1}>
          {formatPrice(mrp!)}
        </Text>
      )}
      {hasDiscount && showDiscountLabel && (
        <Text style={styles.discount}>{discountPercent}% off</Text>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.xxs },
    price: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
    priceLg: { fontSize: 22, lineHeight: 28 },
    priceSm: { fontSize: 13, lineHeight: 18 },
    mrp: { ...typography.caption, color: colors.mrpStrike, textDecorationLine: 'line-through' },
    mrpLg: { fontSize: 14 },
    discount: { ...typography.captionMedium, color: colors.success },
  });
