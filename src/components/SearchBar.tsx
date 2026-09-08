import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onPressIn?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search Ayurvedic products',
  onSubmit,
  onPressIn,
  editable = true,
  autoFocus,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPressIn} style={styles.container}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        editable={editable}
        autoFocus={autoFocus}
        pointerEvents={editable ? 'auto' : 'none'}
      />
      {value.length > 0 && onClear && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      height: 44,
      gap: spacing.xs,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      height: '100%',
    },
  });
