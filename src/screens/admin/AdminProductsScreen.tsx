import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { ProductRepository } from '../../repositories/ProductRepository';
import { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export function AdminProductsScreen() {
  const navigation = useNavigation<Nav>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ProductRepository.getAll();
      setProducts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    await ProductRepository.deleteProduct(pendingDeleteId);
    setPendingDeleteId(null);
    loadProducts();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => setSidebarVisible(true)} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or brand"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
        <PrimaryButton
          label="+ Add Product"
          onPress={() => navigation.navigate('AdminAddProduct')}
          fullWidth={false}
          size="md"
          style={styles.addBtn}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading products..." />
      ) : error ? (
        <ErrorState onRetry={loadProducts} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="cube-outline" title="No products found" description="Try a different search term or add a new product." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={{ uri: item.images[0] }} style={styles.rowImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowBrand}>{item.brand}</Text>
                <View style={styles.rowMetaRow}>
                  <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
                  <View style={[styles.stockChip, item.stock <= 30 ? styles.stockChipLow : styles.stockChipOk]}>
                    <Text style={[styles.stockChipText, item.stock <= 30 ? styles.stockChipTextLow : styles.stockChipTextOk]}>
                      {item.stock <= 30 ? `Low Stock: ${item.stock}` : `Stock: ${item.stock}`}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => navigation.navigate('AdminEditProduct', { productId: item.id })}
                  style={styles.actionIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                  hitSlop={8}
                >
                  <Ionicons name="create-outline" size={18} color={colors.adminAccent} />
                </Pressable>
                <Pressable
                  onPress={() => setPendingDeleteId(item.id)}
                  style={styles.actionIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <ConfirmationDialog
        visible={!!pendingDeleteId}
        title="Delete Product"
        description="This will permanently remove the product from your catalog. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <AdminSidebarNav
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeRoute="AdminProducts"
      />
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
  toolbar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, alignItems: 'center' },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, height: '100%' },
  addBtn: { paddingHorizontal: spacing.sm },
  listContent: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  rowImage: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  rowName: { ...typography.bodyMedium, color: colors.textPrimary },
  rowBrand: { ...typography.caption, color: colors.textMuted },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  rowPrice: { ...typography.captionMedium, color: colors.textPrimary },
  stockChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  stockChipOk: { backgroundColor: colors.successSurface },
  stockChipLow: { backgroundColor: colors.dangerSurface },
  stockChipText: { ...typography.tiny, fontWeight: '700' },
  stockChipTextOk: { color: colors.success },
  stockChipTextLow: { color: colors.danger },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  actionIconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
