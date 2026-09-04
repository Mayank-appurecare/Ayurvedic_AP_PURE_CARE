import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { AdminStackParamList } from '../navigation/types';

interface NavItem {
  label: string;
  route: keyof AdminStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', route: 'AdminDashboard', icon: 'speedometer-outline' }],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', route: 'AdminProducts', icon: 'cube-outline' },
      { label: 'Categories', route: 'AdminCategories', icon: 'grid-outline' },
      { label: 'Inventory', route: 'AdminInventory', icon: 'file-tray-stacked-outline' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', route: 'AdminOrders', icon: 'receipt-outline' },
      { label: 'Customers', route: 'AdminCustomers', icon: 'people-outline' },
      { label: 'Reviews', route: 'AdminReviews', icon: 'star-outline' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Coupons', route: 'AdminCoupons', icon: 'pricetag-outline' },
      { label: 'Offers', route: 'AdminOffers', icon: 'gift-outline' },
      { label: 'Banners', route: 'AdminBanners', icon: 'image-outline' },
      { label: 'Articles', route: 'AdminArticles', icon: 'document-text-outline' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', route: 'AdminNotifications', icon: 'notifications-outline' },
      { label: 'Analytics', route: 'AdminAnalytics', icon: 'bar-chart-outline' },
      { label: 'Settings', route: 'AdminSettings', icon: 'settings-outline' },
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  activeRoute?: keyof AdminStackParamList;
}

export function AdminSidebarNav({ visible, onClose, navigation, activeRoute }: Props) {
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: keyof AdminStackParamList) => {
    onClose();
    navigation.navigate(route as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
        <View style={[styles.drawer, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="leaf" size={20} color={colors.textOnPrimary} />
            </View>
            <View>
              <Text style={styles.brand}>Ojas Ayurveda</Text>
              <Text style={styles.brandSub}>Admin Panel</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {NAV_GROUPS.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map((item) => {
                  const active = activeRoute === item.route;
                  return (
                    <Pressable
                      key={item.route}
                      onPress={() => handleNavigate(item.route)}
                      style={[styles.navItem, active && styles.navItemActive]}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Ionicons name={item.icon} size={18} color={active ? colors.textOnPrimary : colors.textInverse} />
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close menu" hitSlop={10}>
            <Ionicons name="close" size={20} color={colors.textInverse} />
            <Text style={styles.closeLabel}>Close Menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  drawer: {
    width: 260,
    backgroundColor: colors.adminSidebar,
    paddingHorizontal: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.adminAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...typography.bodyMedium, color: colors.textInverse },
  brandSub: { ...typography.tiny, color: 'rgba(255,255,255,0.6)' },
  scroll: { flex: 1 },
  group: { marginBottom: spacing.md },
  groupTitle: {
    ...typography.tiny,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  navItemActive: { backgroundColor: colors.adminAccent },
  navLabel: { ...typography.body, color: 'rgba(255,255,255,0.85)' },
  navLabelActive: { color: colors.textInverse, fontWeight: '700' },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  closeLabel: { ...typography.captionMedium, color: 'rgba(255,255,255,0.8)' },
});
