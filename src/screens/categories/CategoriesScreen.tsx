import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { categoryGridColumns, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { CategoryCard } from '../../components/CategoryCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Category, Concern } from '../../types';

type CategoriesNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'CategoriesTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function CategoriesScreen() {
  const navigation = useNavigation<CategoriesNavigationProp>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoriesResult, concernsResult] = await Promise.all([
        CategoryRepository.getAll(),
        CategoryRepository.getConcerns(),
      ]);
      setCategories(categoriesResult);
      setConcerns(concernsResult);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // useWindowDimensions re-renders on resize/rotation, so the grid reflows
  // instead of keeping whatever column count the first render happened to see.
  const { width } = useWindowDimensions();
  const numColumns = categoryGridColumns(width);
  // Narrow phones get slightly tighter page padding so three cards still have
  // room for a full category name.
  const listPadding = width < 380 ? spacing.sm : spacing.md;

  return (
    // No 'bottom' edge: this screen only ever renders inside the bottom tab
    // navigator, whose own tab bar already reserves the device's bottom
    // safe-area inset — adding it again here left a redundant blank strip
    // between the content and the tab bar.
    <SafeAreaView edges={[]} style={styles.safe}>
      <AppHeader title="Categories" showBack onBackPress={() => navigation.navigate('HomeTab')} />
      {loading ? (
        <LoadingState label="Loading categories..." />
      ) : error ? (
        <ErrorState description="We couldn't load categories." onRetry={load} />
      ) : (
        <FlatList
          data={categories}
          // Remounting on column change is required: FlatList cannot switch
          // numColumns in place.
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: listPadding }]}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          ListHeaderComponent={
            <View style={styles.concernSection}>
              <Text style={styles.sectionTitle}>Shop by Concern</Text>
              <FlatList
                data={concerns}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: spacing.xs }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.concernChip}
                    onPress={() =>
                      navigation.navigate('CategoryProducts', {
                        categoryId: '',
                        categoryName: item.name,
                        concernId: item.id,
                      })
                    }
                    accessibilityRole="button"
                  >
                    <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                    <Text style={styles.concernLabel}>{item.name}</Text>
                  </Pressable>
                )}
              />
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>All Categories</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <CategoryCard
                category={item}
                onPress={() =>
                  navigation.navigate('CategoryProducts', {
                    categoryId: item.id,
                    categoryName: item.name,
                  })
                }
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    // paddingHorizontal is applied inline so it can tighten on narrow phones.
    listContent: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
    // Column spacing comes from `gap` alone; per-card horizontal margins used to
    // stack on top of it and stole ~24px of usable width at phone sizes.
    row: { gap: spacing.sm },
    cardWrap: { flex: 1, marginBottom: spacing.sm },
    concernSection: { marginBottom: spacing.sm },
    sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
    concernChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
    },
    concernLabel: { ...typography.captionMedium, color: colors.textPrimary },
  });
