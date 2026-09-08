import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { BannerRepository } from '../../repositories/BannerRepository';
import { Banner } from '../../types';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const emptyForm = { title: '', subtitle: '', image: '', ctaLabel: '' };

export function AdminBannersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const load = useCallback(() => {
    setError(false);
    BannerRepository.getAll()
      .then(setBanners)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await BannerRepository.createBanner({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        image: form.image.trim() || `https://picsum.photos/seed/${Date.now()}/1000/600`,
        ctaLabel: form.ctaLabel.trim() || undefined,
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
    await BannerRepository.deleteBanner(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Banners</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {banners === null && !error && <LoadingState label="Loading banners..." />}
      {error && <ErrorState onRetry={load} />}

      {banners !== null && !error && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PrimaryButton
            label={showForm ? 'Close Form' : '+ Add Banner'}
            onPress={() => setShowForm((v) => !v)}
            icon={
              <Ionicons name={showForm ? 'close' : 'add'} size={16} color={colors.textOnPrimary} />
            }
          />

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Banner</Text>
              <FormField
                label="Title"
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="Pure Ayurveda, Delivered to You"
              />
              <FormField
                label="Subtitle"
                value={form.subtitle}
                onChangeText={(v) => setForm({ ...form, subtitle: v })}
                placeholder="Discover natural wellness essentials"
              />
              <FormField
                label="Image URL"
                value={form.image}
                onChangeText={(v) => setForm({ ...form, image: v })}
                placeholder="https://..."
              />
              <FormField
                label="CTA Label"
                value={form.ctaLabel}
                onChangeText={(v) => setForm({ ...form, ctaLabel: v })}
                placeholder="Shop Now"
              />
              <PrimaryButton
                label="Save Banner"
                onPress={handleAdd}
                loading={saving}
                style={{ marginTop: spacing.xs }}
              />
            </View>
          )}

          {banners.length === 0 ? (
            <EmptyState
              icon="image-outline"
              title="No banners yet"
              description="Add your first home screen banner."
            />
          ) : (
            banners.map((banner) => (
              <View key={banner.id} style={styles.card}>
                <Image source={{ uri: banner.image }} style={styles.image} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {banner.title}
                  </Text>
                  {!!banner.subtitle && (
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {banner.subtitle}
                    </Text>
                  )}
                  {!!banner.ctaLabel && (
                    <View style={styles.ctaChip}>
                      <Text style={styles.ctaText}>{banner.ctaLabel}</Text>
                    </View>
                  )}
                  <View style={styles.actions}>
                    <SecondaryButton
                      label="Delete"
                      variant="ghost"
                      fullWidth={false}
                      onPress={() => setDeleteTarget(banner)}
                      style={styles.actionBtn}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AdminSidebarNav
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminBanners"
      />

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete Banner"
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
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  image: { width: '100%', height: 140, backgroundColor: colors.surfaceMuted },
  cardContent: { padding: spacing.sm, gap: 4 },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  ctaChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  ctaText: { ...typography.tiny, color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: spacing.xxs },
  actionBtn: { flex: 0, paddingHorizontal: spacing.sm },
});
