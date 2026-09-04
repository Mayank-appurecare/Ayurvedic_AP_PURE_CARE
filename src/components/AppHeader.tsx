import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';

interface Props {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcons?: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; badge?: number }[];
  transparent?: boolean;
  subtitle?: string;
}

export function AppHeader({ title, showBack, onBackPress, rightIcons, transparent, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }, transparent && styles.transparent]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable onPress={onBackPress} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <View style={styles.titleWrap}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightIcons}>
          {rightIcons?.map((icon) => (
            <Pressable
              key={icon.name}
              onPress={icon.onPress}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
            >
              <Ionicons name={icon.name} size={22} color={colors.textPrimary} />
              {!!icon.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{icon.badge > 9 ? '9+' : icon.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const radiusPill = 999;

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 44,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...typography.h4, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  rightIcons: { flexDirection: 'row' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    borderRadius: radiusPill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: colors.textInverse, fontSize: 9, fontWeight: '700' },
});
