import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../../navigation/types';
import { gridColumns, radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { SearchBar } from '../../components/SearchBar';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { FilterBottomSheet } from '../../components/FilterBottomSheet';
import { SortBottomSheet } from '../../components/SortBottomSheet';
import { ProductRepository } from '../../repositories/ProductRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Category, Product, ProductFilters, SortOption } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

const RECENT_SEARCHES_KEY = '@ojas_ayurveda/recent_searches';
const POPULAR_SEARCHES = ['Ashwagandha', 'Hair Oil', 'Immunity', 'Chyawanprash', 'Skin Care', 'Turmeric', 'Triphala', 'Sleep'];

function applyClientFilters(list: Product[], filters: ProductFilters): Product[] {
  let result = list;
  if (filters.categoryIds?.length) result = result.filter((p) => filters.categoryIds!.includes(p.categoryId));
  if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.brands?.length) result = result.filter((p) => filters.brands!.includes(p.brand));
  if (filters.minRating !== undefined) result = result.filter((p) => p.rating >= filters.minRating!);
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

export function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NavProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<SortOption>('relevance');
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
      const [categoriesResult, brandsResult] = await Promise.all([CategoryRepository.getAll(), ProductRepository.getBrands()]);
      setCategories(categoriesResult);
      setBrands(brandsResult);
    })();
  }, []);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const found = await ProductRepository.search(text);
      setResults(found);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  const persistRecentSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecentSearches(next);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
    persistRecentSearch(query);
  };

  const handleChipPress = (term: string) => {
    setQuery(term);
    runSearch(term);
    persistRecentSearch(term);
  };

  const displayedResults = useMemo(() => {
    if (!results) return [];
    return applyClientSort(applyClientFilters(results, filters), sort);
  }, [results, filters, sort]);

  const numColumns = gridColumns();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={handleChangeText}
            onSubmit={handleSubmit}
            onClear={() => {
              setQuery('');
              setResults(null);
            }}
            autoFocus
            editable
          />
        </View>
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.suggestionsContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>Recent Searches</Text>
              <View style={styles.chipsWrap}>
                {recentSearches.map((term) => (
                  <Pressable key={term} style={styles.chip} onPress={() => handleChipPress(term)} accessibilityRole="button">
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.chipLabel}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Popular Searches</Text>
            <View style={styles.chipsWrap}>
              {POPULAR_SEARCHES.map((term) => (
                <Pressable key={term} style={styles.chip} onPress={() => handleChipPress(term)} accessibilityRole="button">
                  <Ionicons name="trending-up-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.chipLabel}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : loading ? (
        <LoadingState label="Searching..." />
      ) : displayedResults.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={`No results for "${query}"`}
          description="Check your spelling or browse our categories instead."
          actionLabel="Browse Categories"
          onAction={() => navigation.navigate('Main', { screen: 'CategoriesTab' })}
        />
      ) : (
        <>
          <View style={styles.toolbar}>
            <Text style={styles.count}>{displayedResults.length} results</Text>
            <View style={styles.toolbarActions}>
              <Pressable style={styles.pillBtn} onPress={() => setFilterVisible(true)} accessibilityRole="button">
                <Ionicons name="options-outline" size={16} color={colors.primary} />
                <Text style={styles.pillLabel}>Filter</Text>
              </Pressable>
              <Pressable style={styles.pillBtn} onPress={() => setSortVisible(true)} accessibilityRole="button">
                <Ionicons name="swap-vertical-outline" size={16} color={colors.primary} />
                <Text style={styles.pillLabel}>Sort</Text>
              </Pressable>
            </View>
          </View>
          <FlatList
            data={displayedResults}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
              </View>
            )}
          />
        </>
      )}

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={categories}
        brands={brands}
        value={filters}
        onApply={setFilters}
      />
      <SortBottomSheet visible={sortVisible} value={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, gap: spacing.xxs },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  suggestionsContainer: { padding: spacing.md, gap: spacing.lg },
  suggestionSection: { gap: spacing.sm },
  suggestionTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipLabel: { ...typography.caption, color: colors.textPrimary },
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
