import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Category } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/new-category/400/400';

interface FormState {
  name: string;
  description: string;
  image: string;
}

const EMPTY_FORM: FormState = { name: '', description: '', image: PLACEHOLDER_IMAGE };

export function AdminCategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await CategoryRepository.getAll();
      setCategories(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddForm = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormVisible(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, description: category.description ?? '', image: category.image ?? PLACEHOLDER_IMAGE });
    setFormError('');
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (editingCategory) {
      await CategoryRepository.updateCategory({
        ...editingCategory,
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim() || PLACEHOLDER_IMAGE,
      });
    } else {
      await CategoryRepository.createCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim() || PLACEHOLDER_IMAGE,
        icon: 'leaf-outline',
        productCount: 0,
      });
    }
    setFormVisible(false);
    loadCategories();
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    await CategoryRepository.deleteCategory(pendingDeleteId);
    setPendingDeleteId(null);
    loadCategories();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => setSidebarVisible(true)} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.toolbar}>
        <PrimaryButton label="+ Add Category" onPress={openAddForm} fullWidth={false} size="md" style={styles.addBtn} />
      </View>

      {loading ? (
        <LoadingState label="Loading categories..." />
      ) : error ? (
        <ErrorState onRetry={loadCategories} />
      ) : categories.length === 0 ? (
        <EmptyState icon="grid-outline" title="No categories yet" actionLabel="Add Category" onAction={openAddForm} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCount}>{item.productCount} products</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEditForm(item)} style={styles.cardActionBtn} accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`}>
                    <Ionicons name="create-outline" size={16} color={colors.adminAccent} />
                  </Pressable>
                  <Pressable onPress={() => setPendingDeleteId(item.id)} style={styles.cardActionBtn} accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(t) => {
                setForm((prev) => ({ ...prev, name: t }));
                if (formError) setFormError('');
              }}
              placeholder="e.g. Immunity Booster"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={(t) => setForm((prev) => ({ ...prev, description: t }))}
              placeholder="Short description"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Image URL</Text>
            <TextInput
              value={form.image}
              onChangeText={(t) => setForm((prev) => ({ ...prev, image: t }))}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />
            {!!formError && <Text style={styles.errorText}>{formError}</Text>}
            <View style={styles.modalActions}>
              <SecondaryButton label="Cancel" onPress={() => setFormVisible(false)} style={styles.modalActionBtn} />
              <PrimaryButton label="Save" onPress={handleSave} style={styles.modalActionBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationDialog
        visible={!!pendingDeleteId}
        title="Delete Category"
        description="Products in this category will remain but lose their category assignment reference."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <AdminSidebarNav visible={sidebarVisible} onClose={() => setSidebarVisible(false)} navigation={navigation} activeRoute="AdminCategories" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.adminSidebar,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h4, color: colors.textInverse },
  toolbar: { padding: spacing.md, alignItems: 'flex-start' },
  addBtn: { paddingHorizontal: spacing.sm },
  listContent: { padding: spacing.md, gap: spacing.sm },
  columnWrapper: { gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm, ...shadow.sm },
  cardImage: { width: '100%', height: 90, backgroundColor: colors.surfaceMuted },
  cardBody: { padding: spacing.sm, gap: 2 },
  cardName: { ...typography.bodyMedium, color: colors.textPrimary },
  cardCount: { ...typography.caption, color: colors.textMuted },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cardActionBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, gap: spacing.xxs },
  modalTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  modalLabel: { ...typography.captionMedium, color: colors.textPrimary, marginTop: spacing.xs },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalActionBtn: { flex: 1 },
});
