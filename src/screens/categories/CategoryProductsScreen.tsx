import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';
import { gridColumns, radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { ProductCard } from '../../components/ProductCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { FilterBottomSheet } from '../../components/FilterBottomSheet';
import { SortBottomSheet } from '../../components/SortBottomSheet';
import { ProductRepository } from '../../repositories/ProductRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Category, Product, ProductFilters, SortOption } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryProducts'>;
type RouteType = RouteProp<RootStackParamList, 'CategoryProducts'>;

function applyClientFilters(list: Product[], filters: ProductFilters): Product[] {
  let result = list;
  if (filters.categoryIds?.length)
    result = result.filter((p) => filters.categoryIds!.includes(p.categoryId));
  if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.brands?.length) result = result.filter((p) => filters.brands!.includes(p.brand));
  if (filters.minRating !== undefined)
    result = result.filter((p) => p.rating >= filters.minRating!);
  if (filters.inStockOnly) result = result.filter((p) => p.stock > 0);
  if (filters.onOfferOnly) result = result.filter((p) => p.discountPercent > 0);
  return result;
}

function applyClientSort(list: Product[], sort: SortOption): Product[] {
  const result = [...list];
  switch (sort) {
    case 'popularity':
      return result.sort((a, b) => b.reviewCount - a.reviewCount);
    case 'rating':
      return result.sort((a, b) => b.rating - a.rating);
    case 'price_low_high':
      return result.sort((a, b) => a.price - b.price);
    case 'price_high_low':
      return result.sort((a, b) => b.price - a.price);
    case 'newest':
      return result.sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
    default:
      return result;
  }
}

export function CategoryProductsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { categoryId, categoryName, concernId } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<SortOption>('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoriesResult, brandsResult] = await Promise.all([
        CategoryRepository.getAll(),
        ProductRepository.getBrands(),
      ]);
      setCategories(categoriesResult);
      setBrands(brandsResult);

      let result: Product[];
      if (concernId) {
        const byConcern = await ProductRepository.getByConcern(concernId);
        result = applyClientSort(applyClientFilters(byConcern, filters), sort);
      } else if (!categoryId) {
        // No category and no concern = browse everything. This is what Home's
        // "See All" opens; the repository already serves the API product list
        // when a catalog is present.
        result = await ProductRepository.getAll(filters, sort);
      } else {
        result = await ProductRepository.getByCategory(categoryId, filters, sort);
      }
      setProducts(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [categoryId, concernId, filters, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const numColumns = gridColumns();
  const hasActiveFilters = useMemo(
    () =>
      !!(
        filters.categoryIds?.length ||
        filters.brands?.length ||
        filters.minRating ||
        filters.minPrice !== undefined ||
        filters.inStockOnly ||
        filters.onOfferOnly
      ),
    [filters]
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <AppHeader
        title={categoryName ?? 'Products'}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.toolbar}>
        <Text style={styles.count}>{products.length} products</Text>
        <View style={styles.toolbarActions}>
          <Pressable
            style={styles.pillBtn}
            onPress={() => setFilterVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons name="options-outline" size={16} color={colors.primary} />
            <Text style={styles.pillLabel}>Filter{hasActiveFilters ? ' •' : ''}</Text>
          </Pressable>
          <Pressable
            style={styles.pillBtn}
            onPress={() => setSortVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons name="swap-vertical-outline" size={16} color={colors.primary} />
            <Text style={styles.pillLabel}>Sort</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading products..." />
      ) : error ? (
        <ErrorState description="We couldn't load these products." onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="leaf-outline"
          title="No products found"
          description="Try adjusting your filters to see more results."
          actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
          onAction={hasActiveFilters ? () => setFilters({}) : undefined}
        />
      ) : (
        <FlatList
          data={products}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              />
            </View>
          )}
        />
      )}

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={categories}
        brands={brands}
        value={filters}
        onApply={setFilters}
        hideCategoryFilter={!!concernId}
      />
      <SortBottomSheet
        visible={sortVisible}
        value={sort}
        onSelect={setSort}
        onClose={() => setSortVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    count: { ...typography.caption, color: colors.textSecondary },
    toolbarActions: { flexDirection: 'row', gap: spacing.sm },
    pillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    pillLabel: { ...typography.captionMedium, color: colors.primary },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    row: { gap: spacing.sm },
    cardWrap: { flex: 1, marginBottom: spacing.sm, marginHorizontal: spacing.xxs },
  });
