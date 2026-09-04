import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Article } from '../../types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { articleCategories } from '../../data/articles';
import { ArticleRepository } from '../../repositories/ArticleRepository';
import { AppHeader } from '../../components/AppHeader';
import { SearchBar } from '../../components/SearchBar';
import { ArticleCard } from '../../components/ArticleCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function ArticlesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [featured, setFeatured] = useState<Article | undefined>();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([ArticleRepository.getAll(), ArticleRepository.getFeatured()]).then(([list, feat]) => {
      setAllArticles(list);
      setFeatured(feat);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allArticles.filter((article) => {
      const matchesQuery =
        !q || article.title.toLowerCase().includes(q) || article.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory = !activeCategory || article.category === activeCategory;
      return matchesQuery && matchesCategory && article.id !== featured?.id;
    });
  }, [allArticles, query, activeCategory, featured]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Ayurveda & Wellness" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading articles..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.searchWrap}>
                <SearchBar value={query} onChangeText={setQuery} placeholder="Search articles" onClear={() => setQuery('')} />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                <Chip label="All" active={!activeCategory} onPress={() => setActiveCategory(null)} />
                {articleCategories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    active={activeCategory === category}
                    onPress={() => setActiveCategory(category)}
                  />
                ))}
              </ScrollView>

              {featured && !query && !activeCategory && (
                <View style={styles.featuredWrap}>
                  <Text style={styles.sectionTitle}>Featured</Text>
                  <ArticleCard article={featured} onPress={() => navigation.navigate('ArticleDetail', { articleId: featured.id })} />
                </View>
              )}

              {filtered.length > 0 && <Text style={styles.sectionTitle}>All Articles</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ArticleCard horizontal article={item} onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="book-outline" title="No articles found" description="Try a different search term or category." />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  searchWrap: { marginBottom: spacing.sm },
  chipsRow: { gap: spacing.xs, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnPrimary, fontWeight: '600' },
  featuredWrap: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  cardWrap: { marginBottom: spacing.sm },
});
