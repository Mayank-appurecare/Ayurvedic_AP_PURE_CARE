import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

interface Props {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isSm = size === 'sm';
  return (
    <View style={[styles.container, isSm && styles.containerSm]}>
      <Pressable
        onPress={onDecrease}
        disabled={quantity <= min}
        hitSlop={6}
        style={[styles.btn, isSm && styles.btnSm, quantity <= min && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons
          name="remove"
          size={isSm ? 14 : 16}
          color={quantity <= min ? colors.textMuted : colors.primary}
        />
      </Pressable>
      <Text style={[styles.value, isSm && styles.valueSm]}>{quantity}</Text>
      <Pressable
        onPress={onIncrease}
        disabled={quantity >= max}
        hitSlop={6}
        style={[styles.btn, isSm && styles.btnSm, quantity >= max && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Ionicons
          name="add"
          size={isSm ? 14 : 16}
          color={quantity >= max ? colors.textMuted : colors.primary}
        />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    containerSm: {},
    btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    btnSm: { width: 28, height: 28 },
    btnDisabled: { opacity: 0.4 },
    value: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      minWidth: 28,
      textAlign: 'center',
    },
    valueSm: { ...typography.captionMedium, minWidth: 22 },
  });
