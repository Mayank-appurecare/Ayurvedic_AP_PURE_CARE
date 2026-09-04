import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

interface Props {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const LABEL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Office: 'business-outline',
  Other: 'location-outline',
};

export function AddressCard({ address, selected, onSelect, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onSelect} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Ionicons name={LABEL_ICON[address.label] ?? 'location-outline'} size={16} color={colors.primary} />
          <Text style={styles.label}>{address.label}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        {selected !== undefined && (
          <Ionicons
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={selected ? colors.primary : colors.border}
          />
        )}
      </View>
      <Text style={styles.name}>{address.fullName}</Text>
      <Text style={styles.text}>
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}
      </Text>
      <Text style={styles.text}>
        {address.city}, {address.state} - {address.pincode}
      </Text>
      <Text style={styles.text}>Phone: {address.phone}</Text>
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <Pressable onPress={onEdit} style={styles.actionBtn} accessibilityRole="button">
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={styles.actionBtn} accessibilityRole="button">
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
    ...shadow.sm,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { ...typography.bodyMedium, color: colors.textPrimary },
  defaultBadge: { backgroundColor: colors.primarySurface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  defaultText: { ...typography.tiny, color: colors.primary, fontWeight: '700' },
  name: { ...typography.bodyMedium, color: colors.textPrimary },
  text: { ...typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { ...typography.captionMedium, color: colors.primary },
});
