import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderTimelineEvent } from '../types';
import { spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { formatDateTime } from '../utils/format';

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  placed: 'receipt-outline',
  confirmed: 'checkmark-circle-outline',
  packed: 'cube-outline',
  shipped: 'airplane-outline',
  out_for_delivery: 'bicycle-outline',
  delivered: 'home-outline',
  cancelled: 'close-circle-outline',
};

export function OrderStatusTimeline({ timeline }: { timeline: OrderTimelineEvent[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View>
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        return (
          <View key={event.status} style={styles.row}>
            <View style={styles.iconColumn}>
              <View style={[styles.iconWrap, event.completed && styles.iconWrapCompleted]}>
                <Ionicons
                  name={STATUS_ICONS[event.status] ?? 'ellipse-outline'}
                  size={16}
                  color={event.completed ? colors.textOnPrimary : colors.textMuted}
                />
              </View>
              {!isLast && <View style={[styles.line, event.completed && styles.lineCompleted]} />}
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.label, event.completed && styles.labelCompleted]}>{event.label}</Text>
              {!!event.timestamp && <Text style={styles.timestamp}>{formatDateTime(event.timestamp)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row' },
  iconColumn: { alignItems: 'center', width: 40 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompleted: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.border },
  lineCompleted: { backgroundColor: colors.primary },
  textColumn: { flex: 1, paddingBottom: spacing.lg, paddingTop: 4 },
  label: { ...typography.bodyMedium, color: colors.textMuted },
  labelCompleted: { color: colors.textPrimary },
  timestamp: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
