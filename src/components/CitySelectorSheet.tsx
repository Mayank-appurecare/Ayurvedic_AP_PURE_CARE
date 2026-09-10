import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { citiesForState } from '../data/indianCities';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { webOnly } from '../utils/webStyle';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  value: string;
  /**
   * Narrows the list to that state's cities. Left unset (no state chosen yet)
   * the whole list is offered, so the picker is never empty.
   */
  state?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function CitySelectorSheet({ visible, value, state, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();

  const results = useMemo(
    () =>
      citiesForState(state).filter((city) =>
        city.toLowerCase().includes(trimmedQuery.toLowerCase())
      ),
    [state, trimmedQuery]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (city: string) => {
    onSelect(city);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={state ? `Select City in ${state}` : 'Select City'}
      maxHeightPercent={80}
    >
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Search city"
        />
      </View>

      {results.length === 0 && <Text style={styles.emptyText}>No matching city found.</Text>}

      {results.map((city) => (
        <Pressable key={city} onPress={() => handleSelect(city)} style={styles.row}>
          <Text style={[styles.label, value === city && styles.labelActive]}>{city}</Text>
          <Ionicons
            name={value === city ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={value === city ? colors.primary : colors.border}
          />
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.textPrimary,
      ...webOnly({ outlineStyle: 'none' }),
    },
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
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
  });
