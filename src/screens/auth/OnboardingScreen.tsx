import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';

const ONBOARDING_KEY = '@ojas_ayurveda/onboarding_complete';
const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Natural Healing',
    description: 'Discover time-tested Ayurvedic remedies rooted in centuries of tradition and nature.',
    image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800',
  },
  {
    id: '2',
    title: 'Ayurvedic Wellness',
    description: 'Everyday rituals and herbal formulations to support balance across mind and body.',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800',
  },
  {
    id: '3',
    title: 'Pure & Trusted Products',
    description: 'Lab-tested, ethically sourced ingredients delivered straight to your doorstep.',
    image: 'https://images.unsplash.com/photo-1596178060810-72660ee8f80c?w=800',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Welcome');
  };

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={finishOnboarding}
        style={[styles.skipBtn, { top: insets.top + spacing.sm }]}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        hitSlop={8}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <View key={slide.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton label={isLast ? 'Get Started' : 'Next'} onPress={handleNext} />
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skipBtn: { position: 'absolute', right: spacing.lg, zIndex: 10, padding: spacing.xs },
  skipText: { ...typography.bodyMedium, color: colors.textSecondary },
  slide: { flex: 1, alignItems: 'center' },
  image: {
    width: '100%',
    height: '55%',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  textBlock: { paddingHorizontal: spacing.xl, marginTop: spacing.xl, alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
});
