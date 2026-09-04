import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { OfferRepository } from '../../repositories/OfferRepository';
import { Coupon } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { CouponCard } from '../../components/CouponCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

type DiscountType = Coupon['discountType'];
const DISCOUNT_TYPES: { key: DiscountType; label: string }[] = [
  { key: 'flat', label: 'Flat' },
  { key: 'percent', label: 'Percent' },
  { key: 'shipping', label: 'Shipping' },
];

const emptyForm = {
  code: '',
  description: '',
  discountType: 'flat' as DiscountType,
  discountValue: '',
  minOrderValue: '',
  expiryDate: '',
};

export function AdminCouponsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const load = useCallback(() => {
    setError(false);
    OfferRepository.getCoupons()
      .then(setCoupons)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!form.code.trim() || !form.description.trim() || !form.discountValue.trim() || !form.expiryDate.trim()) return;
    setSaving(true);
    try {
      await OfferRepository.createCoupon({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        minOrderValue: form.minOrderValue.trim() ? Number(form.minOrderValue) : undefined,
        expiryDate: form.expiryDate.trim(),
        isApplicable: true,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await OfferRepository.deleteCoupon(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Coupons</Text>
        <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open admin menu">
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {coupons === null && !error && <LoadingState label="Loading coupons..." />}
      {error && <ErrorState onRetry={load} />}

      {coupons !== null && !error && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PrimaryButton
            label={showForm ? 'Close Form' : '+ Add Coupon'}
            onPress={() => setShowForm((v) => !v)}
            icon={<Ionicons name={showForm ? 'close' : 'add'} size={16} color={colors.textOnPrimary} />}
          />

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Coupon</Text>
              <FormField label="Code" value={form.code} onChangeText={(v) => setForm({ ...form, code: v })} placeholder="SAVE20" />
              <FormField
                label="Description"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="20% off on all orders"
              />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Discount Type</Text>
                <View style={styles.typeRow}>
                  {DISCOUNT_TYPES.map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={() => setForm({ ...form, discountType: t.key })}
                      style={[styles.typeChip, form.discountType === t.key && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipLabel, form.discountType === t.key && styles.typeChipLabelActive]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <FormField
                label="Discount Value"
                value={form.discountValue}
                onChangeText={(v) => setForm({ ...form, discountValue: v })}
                placeholder="20"
                keyboardType="numeric"
              />
              <FormField
                label="Min Order Value (optional)"
                value={form.minOrderValue}
                onChangeText={(v) => setForm({ ...form, minOrderValue: v })}
                placeholder="499"
                keyboardType="numeric"
              />
              <FormField
                label="Expiry Date"
                value={form.expiryDate}
                onChangeText={(v) => setForm({ ...form, expiryDate: v })}
                placeholder="2026-12-31"
              />
              <PrimaryButton label="Save Coupon" onPress={handleAdd} loading={saving} style={{ marginTop: spacing.xs }} />
            </View>
          )}

          {coupons.length === 0 ? (
            <EmptyState icon="pricetag-outline" title="No coupons yet" description="Add your first coupon code." />
          ) : (
            coupons.map((coupon) => (
              <View key={coupon.id} style={styles.couponWrap}>
                <CouponCard coupon={coupon} showApply={false} />
                <View style={styles.actions}>
                  <SecondaryButton
                    label="Delete"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => setDeleteTarget(coupon)}
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AdminSidebarNav visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="AdminCoupons" />

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete Coupon"
        description={`Are you sure you want to delete "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        keyboardType={keyboardType}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadow.sm },
  formTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xxs },
  field: { gap: spacing.xxs },
  fieldLabel: { ...typography.captionMedium, color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  typeRow: { flexDirection: 'row', gap: spacing.xs },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  typeChipLabel: { ...typography.caption, color: colors.textSecondary },
  typeChipLabelActive: { color: colors.textOnPrimary, fontWeight: '700' },
  couponWrap: { gap: spacing.xs },
  actions: { flexDirection: 'row' },
  actionBtn: { flex: 0, paddingHorizontal: spacing.sm },
});
