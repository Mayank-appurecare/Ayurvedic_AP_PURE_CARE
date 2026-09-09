import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Product } from '../../types';
import { spacing } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { ProductRepository } from '../../repositories/ProductRepository';
import { useWishlist } from '../../context/WishlistContext';
import { AppHeader } from '../../components/AppHeader';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';

export function WishlistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  const showBack = navigation.canGoBack();
  // Reached both as the WishlistTab (tab bar visible below - its own tab bar
  // already reserves the bottom safe-area inset) and as a pushed "Wishlist"
  // route from elsewhere (no tab bar - needs its own bottom inset so content
  // isn't hidden behind the system nav bar). canGoBack() can't tell these
  // apart: the tab bar's default backBehavior keeps tab-switch history, so
  // it's still true on the WishlistTab once another tab has been visited.
  // getState().type is the reliable signal - 'tab' only for the nested
  // Tab.Screen instance, never for the standalone stack route.
  const isTabScreen = (navigation.getState() as { type?: string } | undefined)?.type === 'tab';
  const numColumns = width >= 768 ? 4 : width >= 480 ? 3 : 2;

  useEffect(() => {
    setLoading(true);
    Promise.all(wishlistIds.map((id) => ProductRepository.getById(id))).then((results) => {
      setProducts(results.filter((p): p is Product => !!p));
      setLoading(false);
    });
  }, [wishlistIds]);

  return (
    <SafeAreaView edges={isTabScreen ? ['top'] : ['bottom']} style={styles.container}>
      <AppHeader title="Wishlist" showBack={showBack} onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading your wishlist..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          description="Save products you love to find them here later."
          actionLabel="Explore Products"
          onAction={() => navigation.navigate('Main')}
        />
      ) : (
        <FlatList
          key={numColumns}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
    row: { gap: spacing.md },
  });
