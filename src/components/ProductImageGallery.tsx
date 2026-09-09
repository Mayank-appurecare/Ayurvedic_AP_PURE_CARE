import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

export function ProductImageGallery({ images }: { images: string[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const width = Dimensions.get('window').width;

  // The API sends no image URLs for a catalog product. Fall back to a
  // neutral placeholder — same treatment as ProductCard — instead of
  // rendering an empty FlatList that leaves a blank gap on screen.
  if (images.length === 0) {
    return (
      <View
        testID="product-image-fallback"
        style={[styles.imageWrap, styles.imageFallback, { width }]}
      >
        <Ionicons name="leaf-outline" size={64} color={colors.primaryLight} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        testID="product-image-gallery"
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item}-${index}`}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.imageWrap, { width }]}>
            <Image
              source={{ uri: item }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
          </View>
        )}
      />
      <View style={styles.dots}>
        {images.map((_, index) => (
          <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    imageWrap: { aspectRatio: 1, backgroundColor: colors.surfaceMuted },
    imageFallback: { alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 18 },
  });
