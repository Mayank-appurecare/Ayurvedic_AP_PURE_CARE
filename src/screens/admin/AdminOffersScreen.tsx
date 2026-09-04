import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { OfferRepository } from '../../repositories/OfferRepository';
import { Offer } from '../../types';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const emptyForm = { title: '', subtitle: '', image: '', badge: '', couponCode: '' };

export function AdminOffersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  const load = useCallback(() => {
    setError(false);
    OfferRepository.getOffers()
      .then(setOffers)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!form.title.trim() || !form.subtitle.trim()) return;
    setSaving(true);
    try {
      await OfferRepository.createOffer({
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        image: form.image.trim() || `https://picsum.photos/seed/${Date.now()}/800/500`,
        badge: form.badge.trim() || undefined,
        couponCode: form.couponCode.trim() || undefined,
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
    await OfferRepository.deleteOffer(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Offers</Text>
        <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open admin menu">
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {offers === null && !error && <LoadingState label="Loading offers..." />}
      {error && <ErrorState onRetry={load} />}

      {offers !== null && !error && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PrimaryButton
            label={showForm ? 'Close Form' : '+ Add Offer'}
            onPress={() => setShowForm((v) => !v)}
            icon={<Ionicons name={showForm ? 'close' : 'add'} size={16} color={colors.textOnPrimary} />}
          />

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Offer</Text>
              <FormField label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Immunity Season Sale" />
              <FormField label="Subtitle" value={form.subtitle} onChangeText={(v) => setForm({ ...form, subtitle: v })} placeholder="Up to 25% off" />
              <FormField label="Image URL" value={form.image} onChangeText={(v) => setForm({ ...form, image: v })} placeholder="https://..." />
              <FormField label="Badge Text" value={form.badge} onChangeText={(v) => setForm({ ...form, badge: v })} placeholder="25% OFF" />
              <FormField label="Coupon Code (optional)" value={form.couponCode} onChangeText={(v) => setForm({ ...form, couponCode: v })} placeholder="IMMUNITY20" />
              <PrimaryButton label="Save Offer" onPress={handleAdd} loading={saving} style={{ marginTop: spacing.xs }} />
            </View>
          )}

          {offers.length === 0 ? (
            <EmptyState icon="gift-outline" title="No offers yet" description="Add your first promotional offer." />
          ) : (
            offers.map((offer) => (
              <View key={offer.id} style={styles.card}>
                <Image source={{ uri: offer.image }} style={styles.image} />
                <View style={styles.cardContent}>
                  {!!offer.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{offer.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.cardTitle} numberOfLines={1}>{offer.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{offer.subtitle}</Text>
                  {!!offer.couponCode && <Text style={styles.couponCode}>Code: {offer.couponCode}</Text>}
                  <View style={styles.actions}>
                    <SecondaryButton label="Delete" variant="ghost" fullWidth={false} onPress={() => setDeleteTarget(offer)} style={styles.actionBtn} />
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AdminSidebarNav visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="AdminOffers" />

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete Offer"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
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
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  image: { width: 96, height: '100%', minHeight: 120, backgroundColor: colors.surfaceMuted },
  cardContent: { flex: 1, padding: spacing.sm, gap: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.warningSurface, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { ...typography.tiny, color: colors.warning, fontWeight: '700' },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  couponCode: { ...typography.captionMedium, color: colors.primary },
  actions: { flexDirection: 'row', marginTop: spacing.xxs },
  actionBtn: { flex: 0, paddingHorizontal: spacing.sm },
});
