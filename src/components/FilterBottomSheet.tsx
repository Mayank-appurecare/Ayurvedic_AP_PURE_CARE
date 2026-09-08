import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, ProductFilters } from '../types';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

const PRICE_BUCKETS = [
  { label: 'Under ₹200', min: 0, max: 200 },
  { label: '₹200 - ₹400', min: 200, max: 400 },
  { label: '₹400 - ₹600', min: 400, max: 600 },
  { label: 'Above ₹600', min: 600, max: 100000 },
];

const RATINGS = [4, 3, 2];

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  brands: string[];
  value: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  hideCategoryFilter?: boolean;
}

export function FilterBottomSheet({
  visible,
  onClose,
  categories,
  brands,
  value,
  onApply,
  hideCategoryFilter,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState<ProductFilters>(value);

  React.useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggleCategory = (id: string) => {
    const current = draft.categoryIds ?? [];
    setDraft({
      ...draft,
      categoryIds: current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    });
  };

  const toggleBrand = (brand: string) => {
    const current = draft.brands ?? [];
    setDraft({
      ...draft,
      brands: current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand],
    });
  };

  const selectPriceBucket = (min: number, max: number) => {
    const isSame = draft.minPrice === min && draft.maxPrice === max;
    setDraft({ ...draft, minPrice: isSame ? undefined : min, maxPrice: isSame ? undefined : max });
  };

  const selectRating = (rating: number) => {
    setDraft({ ...draft, minRating: draft.minRating === rating ? undefined : rating });
  };

  const clearAll = () => setDraft({});

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      maxHeightPercent={85}
      footer={
        <View style={styles.footerRow}>
          <SecondaryButton label="Clear All" onPress={clearAll} style={styles.footerBtn} />
          <PrimaryButton
            label="Apply Filters"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={styles.footerBtn}
          />
        </View>
      }
    >
      {!hideCategoryFilter && (
        <Section title="Categories">
          <View style={styles.chipsWrap}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                active={!!draft.categoryIds?.includes(cat.id)}
                onPress={() => toggleCategory(cat.id)}
              />
            ))}
          </View>
        </Section>
      )}

      <Section title="Price Range">
        <View style={styles.chipsWrap}>
          {PRICE_BUCKETS.map((bucket) => (
            <Chip
              key={bucket.label}
              label={bucket.label}
              active={draft.minPrice === bucket.min && draft.maxPrice === bucket.max}
              onPress={() => selectPriceBucket(bucket.min, bucket.max)}
            />
          ))}
        </View>
      </Section>

      <Section title="Brand">
        <View style={styles.chipsWrap}>
          {brands.map((brand) => (
            <Chip
              key={brand}
              label={brand}
              active={!!draft.brands?.includes(brand)}
              onPress={() => toggleBrand(brand)}
            />
          ))}
        </View>
      </Section>

      <Section title="Customer Rating">
        <View style={styles.chipsWrap}>
          {RATINGS.map((rating) => (
            <Chip
              key={rating}
              label={`${rating}★ & above`}
              active={draft.minRating === rating}
              onPress={() => selectRating(rating)}
            />
          ))}
        </View>
      </Section>

      <Section title="Availability & Offers">
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setDraft({ ...draft, inStockOnly: !draft.inStockOnly })}
        >
          <Ionicons
            name={draft.inStockOnly ? 'checkbox' : 'square-outline'}
            size={20}
            color={draft.inStockOnly ? colors.primary : colors.border}
          />
          <Text style={styles.checkboxLabel}>In Stock Only</Text>
        </Pressable>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setDraft({ ...draft, onOfferOnly: !draft.onOfferOnly })}
        >
          <Ionicons
            name={draft.onOfferOnly ? 'checkbox' : 'square-outline'}
            size={20}
            color={draft.onOfferOnly ? colors.primary : colors.border}
          />
          <Text style={styles.checkboxLabel}>On Offer</Text>
        </Pressable>
      </Section>
      <View style={{ height: spacing.lg }} />
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: { marginBottom: spacing.md },
    sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipLabel: { ...typography.caption, color: colors.textSecondary },
    chipLabelActive: { color: colors.textOnPrimary, fontWeight: '600' },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    checkboxLabel: { ...typography.body, color: colors.textPrimary },
    footerRow: { flexDirection: 'row', gap: spacing.sm },
    footerBtn: { flex: 1 },
  });
