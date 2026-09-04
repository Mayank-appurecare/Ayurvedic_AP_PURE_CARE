import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Category } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

export function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.imageWrap}>
        <Image source={{ uri: category.image }} style={styles.image} contentFit="cover" transition={150} />
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
  name: { ...typography.captionMedium, color: colors.textPrimary, textAlign: 'center' },
  count: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
});
