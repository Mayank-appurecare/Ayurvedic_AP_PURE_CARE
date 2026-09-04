import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { formatDate } from '../utils/format';

export function ArticleCard({ article, onPress, horizontal }: { article: Article; onPress: () => void; horizontal?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, horizontal && styles.cardHorizontal, pressed && styles.pressed]}
    >
      <Image source={{ uri: article.image }} style={[styles.image, horizontal && styles.imageHorizontal]} contentFit="cover" />
      <View style={styles.content}>
        <Text style={styles.category}>{article.category}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta}>{article.readTimeMinutes} min read</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.meta}>{formatDate(article.date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  cardHorizontal: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.95 },
  image: { width: '100%', height: 140, backgroundColor: colors.surfaceMuted },
  imageHorizontal: { width: 100, height: 100 },
  content: { padding: spacing.sm, flex: 1, gap: 4 },
  category: { ...typography.tiny, color: colors.primary, textTransform: 'uppercase', fontWeight: '700' },
  title: { ...typography.bodyMedium, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { ...typography.tiny, color: colors.textMuted },
  metaDot: { color: colors.textMuted },
});
