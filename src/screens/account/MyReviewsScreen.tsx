import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Review } from '../../types';
import { spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { reviews as allReviews } from '../../data/reviews';
import { ProductRepository } from '../../repositories/ProductRepository';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { ReviewCard } from '../../components/ReviewCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

interface ReviewWithProduct {
  review: Review;
  productName: string;
}

export function MyReviewsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewWithProduct[]>([]);

  useEffect(() => {
    const myReviews = allReviews.filter((r) => r.customerName === (user?.name ?? ''));
    if (myReviews.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    Promise.all(
      myReviews.map(async (review) => {
        const product = await ProductRepository.getById(review.productId);
        return { review, productName: product?.name ?? 'Product' };
      })
    ).then((resolved) => {
      setItems(resolved);
      setLoading(false);
    });
  }, [user?.name]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="My Reviews" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading your reviews..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title="You haven't written any reviews yet"
          description="Share your experience after your next purchase to help other shoppers."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('Main')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.review.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.productName}>{item.productName}</Text>
              <ReviewCard review={item.review} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    productName: { ...typography.captionMedium, color: colors.primary, marginTop: spacing.xs },
  });
