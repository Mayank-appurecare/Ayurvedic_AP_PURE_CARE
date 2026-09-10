import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INDIAN_STATES } from '../data/indianStates';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { webOnly } from '../utils/webStyle';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function StateSelectorSheet({ visible, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => INDIAN_STATES.filter((state) => state.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = useCallback(
    (state: string) => {
      onSelect(state);
      setQuery('');
      onClose();
    },
    [onSelect, onClose]
  );

  const renderItem = useCallback(
    ({ item: state }: { item: string }) => (
      <Pressable onPress={() => handleSelect(state)} style={styles.row}>
        <Text style={[styles.label, value === state && styles.labelActive]}>{state}</Text>
        <Ionicons
          name={value === state ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={value === state ? colors.primary : colors.border}
        />
      </Pressable>
    ),
    [colors, handleSelect, styles, value]
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Select State"
      maxHeightPercent={80}
      scrollable={false}
    >
      {/* Rendered as a FlatList rather than a mapped ScrollView so only the
          rows on screen mount at once - with 36 states this barely matters,
          but it keeps the same pattern as the much longer city list. */}
      <FlatList
        data={results}
        keyExtractor={(state) => state}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search state"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              accessibilityLabel="Search state"
            />
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No matching state found.</Text>}
      />
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
