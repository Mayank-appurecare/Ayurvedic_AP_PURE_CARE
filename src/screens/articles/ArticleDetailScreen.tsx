import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Article } from '../../types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatDate } from '../../utils/format';
import { ArticleRepository } from '../../repositories/ArticleRepository';
import { AppHeader } from '../../components/AppHeader';
import { ArticleCard } from '../../components/ArticleCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

type ArticleDetailRouteProp = RouteProp<RootStackParamList, 'ArticleDetail'>;

export function ArticleDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ArticleDetailRouteProp>();
  const { articleId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.all([ArticleRepository.getById(articleId), ArticleRepository.getRelated(articleId)])
      .then(([foundArticle, relatedArticles]) => {
        if (!foundArticle) {
          setError(true);
        } else {
          setArticle(foundArticle);
          setRelated(relatedArticles);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({ message: `${article.title} — AP Pure Care` });
    } catch {
      // Ignore share cancellation errors.
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} />
        <LoadingState label="Loading article..." />
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} />
        <ErrorState title="Article not found" onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcons={[
          {
            name: bookmarked ? 'bookmark' : 'bookmark-outline',
            onPress: () => setBookmarked((b) => !b),
          },
          { name: 'share-outline', onPress: handleShare },
        ]}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: article.image }} style={styles.hero} contentFit="cover" />
        <View style={styles.content}>
          <Text style={styles.category}>{article.category}</Text>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.meta}>{article.author}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>{formatDate(article.date)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>{article.readTimeMinutes} min read</Text>
          </View>

          {article.content.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          <Text style={styles.disclaimer}>
            This content is for educational purposes only and is not a substitute for professional
            medical advice.
          </Text>

          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Articles</Text>
              <FlatList
                data={related}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.relatedList}
                renderItem={({ item }) => (
                  <View style={styles.relatedCard}>
                    <ArticleCard
                      article={item}
                      onPress={() => navigation.push('ArticleDetail', { articleId: item.id })}
                    />
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hero: { width: '100%', height: 220, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    category: { ...typography.captionMedium, color: colors.primary, textTransform: 'uppercase' },
    title: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xxs },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      marginTop: spacing.sm,
      flexWrap: 'wrap',
    },
    meta: { ...typography.caption, color: colors.textMuted },
    metaDot: { color: colors.textMuted },
    paragraph: {
      ...typography.bodyLg,
      color: colors.textSecondary,
      marginTop: spacing.md,
      lineHeight: 24,
    },
    disclaimer: {
      ...typography.caption,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: spacing.lg,
      padding: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
    },
    relatedSection: { marginTop: spacing.xl },
    relatedTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
    relatedList: { gap: spacing.sm },
    relatedCard: { width: 240 },
  });
