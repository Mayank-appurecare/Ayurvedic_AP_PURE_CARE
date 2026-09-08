import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { categoryImageFor } from '../services/catalog/categoryImages';

export function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // A remote image from the API wins; otherwise fall back to the bundled
  // artwork for this category id/name.
  const imageSource = useMemo(
    () => (category.image ? { uri: category.image } : categoryImageFor(category.id, category.name)),
    [category.image, category.id, category.name]
  );
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.imageWrap}>
        {/* Priority: a real image from the API, then the bundled AP Pure Care
            artwork for this category, then the category's icon. The wrapper is
            already a circle with overflow hidden, so `cover` crops cleanly
            without stretching whatever source wins. */}
        {imageSource ? (
          <Image source={imageSource} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.iconFallback}>
            <Ionicons name={category.icon as any} size={28} color={colors.primary} />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
      <Text style={styles.count}>{category.productCount} products</Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      // Narrower side padding than top/bottom: at three-across phone widths the
      // card is ~91px, and 12px each side left too little room for a long single
      // word like "Management", which was being ellipsised.
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      ...shadow.sm,
    },
    pressed: { opacity: 0.9 },
    imageWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.pill,
      overflow: 'hidden',
      backgroundColor: colors.primarySurface,
      marginBottom: spacing.xs,
    },
    image: { width: '100%', height: '100%' },
    iconFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    name: { ...typography.captionMedium, color: colors.textPrimary, textAlign: 'center' },
    count: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  });
