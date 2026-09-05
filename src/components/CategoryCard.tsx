import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

export function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.imageWrap}>
        {/* API categories carry no image, so fall back to the category's icon
            inside the same circle rather than rendering an empty image. */}
        {category.image ? (
          <Image source={{ uri: category.image }} style={styles.image} contentFit="cover" transition={150} />
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
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
