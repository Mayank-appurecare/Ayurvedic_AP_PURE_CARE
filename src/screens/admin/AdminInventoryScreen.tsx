import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { ProductRepository } from '../../repositories/ProductRepository';
import { Product } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { QuantitySelector } from '../../components/QuantitySelector';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
const LOW_STOCK_THRESHOLD = 30;

export function AdminInventoryScreen() {
  const navigation = useNavigation<Nav>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [saving, setSaving] = useState(false);

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
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    const matchesStock = !lowStockOnly || p.stock <= LOW_STOCK_THRESHOLD;
    return matchesQuery && matchesStock;
  });

  const openRestock = (product: Product) => {
    setRestockProduct(product);
    setRestockQty(product.stock);
  };

  const handleSaveRestock = async () => {
    if (!restockProduct) return;
    setSaving(true);
    try {
      await ProductRepository.updateProduct({ ...restockProduct, stock: restockQty });
      setRestockProduct(null);
      loadProducts();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => setSidebarVisible(true)} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Inventory</Text>
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
        <Pressable
          onPress={() => setLowStockOnly((prev) => !prev)}
          style={[styles.filterToggle, lowStockOnly && styles.filterToggleActive]}
          accessibilityRole="button"
          accessibilityLabel="Toggle low stock only filter"
        >
          <Ionicons name="alert-circle-outline" size={14} color={lowStockOnly ? colors.textOnPrimary : colors.textSecondary} />
          <Text style={[styles.filterToggleText, lowStockOnly && styles.filterToggleTextActive]}>Low Stock</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState label="Loading inventory..." />
      ) : error ? (
        <ErrorState onRetry={loadProducts} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="file-tray-stacked-outline" title="No matching products" description="Try adjusting your search or filter." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLow = item.stock <= LOW_STOCK_THRESHOLD;
            return (
              <View style={[styles.row, isLow && styles.rowLow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowBrand}>{item.brand}</Text>
                  {item.variants.length > 1 && (
                    <Text style={styles.variantBreakdown} numberOfLines={1}>
                      {item.variants.map((v) => `${v.label}: ${v.stock}`).join(' • ')}
                    </Text>
                  )}
                </View>
                <View style={styles.stockColumn}>
                  <Text style={[styles.stockValue, isLow && styles.stockValueLow]}>{item.stock}</Text>
                  <Text style={styles.stockLabel}>in stock</Text>
                </View>
                <Pressable onPress={() => openRestock(item)} style={styles.restockBtn} accessibilityRole="button" accessibilityLabel={`Restock ${item.name}`}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.adminAccent} />
                  <Text style={styles.restockText}>Restock</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!restockProduct} transparent animationType="fade" onRequestClose={() => setRestockProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restock Product</Text>
            {restockProduct && (
              <>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {restockProduct.name}
                </Text>
                <Text style={styles.modalCurrentStock}>Current stock: {restockProduct.stock}</Text>
                <View style={styles.qtyRow}>
                  <QuantitySelector
                    quantity={restockQty}
                    onIncrease={() => setRestockQty((q) => Math.min(q + 10, 99999))}
                    onDecrease={() => setRestockQty((q) => Math.max(q - 10, 0))}
                    min={0}
                    max={99999}
                  />
                </View>
              </>
            )}
            <View style={styles.modalActions}>
              <SecondaryButton label="Cancel" onPress={() => setRestockProduct(null)} style={styles.modalActionBtn} />
              <PrimaryButton label="Update Stock" onPress={handleSaveRestock} loading={saving} style={styles.modalActionBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <AdminSidebarNav visible={sidebarVisible} onClose={() => setSidebarVisible(false)} navigation={navigation} activeRoute="AdminInventory" />
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterToggleActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  filterToggleText: { ...typography.captionMedium, color: colors.textSecondary },
  filterToggleTextActive: { color: colors.textOnPrimary },
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
  rowLow: { borderWidth: 1, borderColor: colors.danger },
  rowName: { ...typography.bodyMedium, color: colors.textPrimary },
  rowBrand: { ...typography.caption, color: colors.textMuted },
  variantBreakdown: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  stockColumn: { alignItems: 'center' },
  stockValue: { ...typography.h4, color: colors.textPrimary },
  stockValueLow: { color: colors.danger },
  stockLabel: { ...typography.tiny, color: colors.textMuted },
  restockBtn: { alignItems: 'center', gap: 2 },
  restockText: { ...typography.tiny, color: colors.adminAccent, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: '100%', maxWidth: 400, gap: spacing.xs },
  modalTitle: { ...typography.h4, color: colors.textPrimary },
  modalProductName: { ...typography.bodyMedium, color: colors.textPrimary },
  modalCurrentStock: { ...typography.caption, color: colors.textMuted },
  qtyRow: { alignItems: 'center', marginVertical: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalActionBtn: { flex: 1 },
});
