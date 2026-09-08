import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortOption } from '../types';
import { spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { BottomSheet } from './BottomSheet';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

interface Props {
  visible: boolean;
  value: SortOption;
  onSelect: (value: SortOption) => void;
  onClose: () => void;
}

export function SortBottomSheet({ visible, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort By" maxHeightPercent={60}>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            onSelect(option.value);
            onClose();
          }}
          style={styles.row}
        >
          <Text style={[styles.label, value === option.value && styles.labelActive]}>
            {option.label}
          </Text>
          <Ionicons
            name={value === option.value ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={value === option.value ? colors.primary : colors.border}
          />
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    label: { ...typography.body, color: colors.textPrimary },
    labelActive: { color: colors.primary, fontWeight: '700' },
  });
