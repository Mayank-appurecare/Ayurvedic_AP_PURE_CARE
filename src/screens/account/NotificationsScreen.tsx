import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';

type NotificationKind = 'order' | 'offer' | 'wellness';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', kind: 'order', icon: 'bicycle-outline', title: 'Your order #OJA10023841 is out for delivery', time: '2h ago', read: false },
  { id: 'n2', kind: 'offer', icon: 'pricetag-outline', title: 'Flat ₹100 off — use APWELCOME on your next order', time: '5h ago', read: false },
  { id: 'n3', kind: 'wellness', icon: 'leaf-outline', title: 'New article: Understanding Ashwagandha', time: 'Yesterday', read: false },
  { id: 'n4', kind: 'order', icon: 'checkmark-circle-outline', title: 'Your order #OJA10022190 has been delivered', time: 'Yesterday', read: true },
  { id: 'n5', kind: 'offer', icon: 'gift-outline', title: 'Immunity Season Sale — up to 25% off is live now', time: '2 days ago', read: true },
  { id: 'n6', kind: 'order', icon: 'cube-outline', title: 'Your order #OJA10024410 has been confirmed', time: '2 days ago', read: true },
  { id: 'n7', kind: 'wellness', icon: 'book-outline', title: '5 Ayurvedic Tips for Better Sleep — new read', time: '3 days ago', read: true },
  { id: 'n8', kind: 'offer', icon: 'ribbon-outline', title: 'Free shipping this weekend on all orders above ₹299', time: '4 days ago', read: true },
  { id: 'n9', kind: 'wellness', icon: 'flask-outline', title: 'The Golden Herb: Turmeric in Ayurveda is trending', time: '5 days ago', read: true },
];

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handlePress = (item: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (item.kind === 'order') {
      navigation.navigate('MyOrders');
    } else if (item.kind === 'wellness') {
      navigation.navigate('Articles');
    } else {
      navigation.navigate('Offers');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Notifications" showBack onBackPress={() => navigation.goBack()} />

      {notifications.length === 0 ? (
        <EmptyState icon="notifications-outline" title="No notifications yet" description="We'll let you know when there's something new." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePress(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { ...typography.body, color: colors.textSecondary },
  titleUnread: { color: colors.textPrimary, fontWeight: '600' },
  time: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 },
});
