import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { ArticleRepository } from '../../repositories/ArticleRepository';
import { articleCategories } from '../../data/articles';
import { Article } from '../../types';
import { formatDate } from '../../utils/format';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const emptyForm = {
  title: '',
  category: articleCategories[0] ?? 'Lifestyle',
  image: '',
  excerpt: '',
  content: '',
  author: 'AP Pure Care Wellness Desk',
  date: new Date().toISOString().slice(0, 10),
  readTimeMinutes: '4',
};

export function AdminArticlesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const load = useCallback(() => {
    setError(false);
    ArticleRepository.getAll()
      .then(setArticles)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) return;
    setSaving(true);
    try {
      const contentLines = form.content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      await ArticleRepository.createArticle({
        title: form.title.trim(),
        category: form.category.trim() || 'Lifestyle',
        tags: [],
        image: form.image.trim() || `https://picsum.photos/seed/${Date.now()}/800/500`,
        excerpt: form.excerpt.trim(),
        content: contentLines.length ? contentLines : [form.excerpt.trim()],
        author: form.author.trim() || 'AP Pure Care Wellness Desk',
        date: form.date.trim() || new Date().toISOString().slice(0, 10),
        readTimeMinutes: Math.max(1, Number(form.readTimeMinutes) || 4),
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
    await ArticleRepository.deleteArticle(deleteTarget.id);
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
        <Text style={styles.headerTitle}>Articles</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {articles === null && !error && <LoadingState label="Loading articles..." />}
      {error && <ErrorState onRetry={load} />}

      {articles !== null && !error && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PrimaryButton
            label={showForm ? 'Close Form' : '+ Add Article'}
            onPress={() => setShowForm((v) => !v)}
            icon={
              <Ionicons name={showForm ? 'close' : 'add'} size={16} color={colors.textOnPrimary} />
            }
          />

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Article</Text>
              <FormField
                label="Title"
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="Understanding Ashwagandha"
              />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipsWrap}>
                  {articleCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm({ ...form, category: cat })}
                      style={[styles.chip, form.category === cat && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipLabel, form.category === cat && styles.chipLabelActive]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <FormField
                label="Image URL"
                value={form.image}
                onChangeText={(v) => setForm({ ...form, image: v })}
                placeholder="https://..."
              />
              <FormField
                label="Excerpt"
                value={form.excerpt}
                onChangeText={(v) => setForm({ ...form, excerpt: v })}
                placeholder="Short summary shown on article cards"
                multiline
              />
              <FormField
                label="Content (one paragraph per line)"
                value={form.content}
                onChangeText={(v) => setForm({ ...form, content: v })}
                placeholder={'First paragraph...\nSecond paragraph...'}
                multiline
                numberOfLines={5}
              />
              <FormField
                label="Author"
                value={form.author}
                onChangeText={(v) => setForm({ ...form, author: v })}
                placeholder="AP Pure Care Wellness Desk"
              />
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={form.date}
                    onChangeText={(v) => setForm({ ...form, date: v })}
                    style={styles.input}
                    placeholder="2026-09-03"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Read Time (min)</Text>
                  <TextInput
                    value={form.readTimeMinutes}
                    onChangeText={(v) =>
                      setForm({ ...form, readTimeMinutes: v.replace(/[^0-9]/g, '') })
                    }
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="4"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <PrimaryButton
                label="Save Article"
                onPress={handleAdd}
                loading={saving}
                style={{ marginTop: spacing.xs }}
              />
            </View>
          )}

          {articles.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No articles yet"
              description="Publish your first wellness article."
            />
          ) : (
            articles.map((article) => (
              <View key={article.id} style={styles.card}>
                <Image source={{ uri: article.image }} style={styles.thumb} />
                <View style={styles.cardContent}>
                  <Text style={styles.category}>{article.category}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(article.date)} • {article.readTimeMinutes} min read
                  </Text>
                  <View style={styles.actions}>
                    <SecondaryButton
                      label="Delete"
                      variant="ghost"
                      fullWidth={false}
                      onPress={() => setDeleteTarget(article)}
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
        activeRoute="AdminArticles"
      />

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete Article"
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
  multiline,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.inputMultiline]}
        accessibilityLabel={label}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
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
  inputMultiline: { height: undefined, minHeight: 88, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnPrimary, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  thumb: { width: 88, height: 100, backgroundColor: colors.surfaceMuted },
  cardContent: { flex: 1, padding: spacing.sm, gap: 3 },
  category: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', marginTop: spacing.xxs },
  actionBtn: { flex: 0, paddingHorizontal: spacing.sm },
});
