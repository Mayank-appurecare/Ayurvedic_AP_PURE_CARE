import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

export function AdminSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@ojas.com');
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveReviews, setAutoApproveReviews] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogout = () => {
    setLogoutVisible(false);
    const parent = navigation.getParent();
    (parent as any)?.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open admin menu">
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Profile</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} accessibilityLabel="Admin name" />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Admin email"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Operational Alerts</Text>
          <ToggleRow label="Low Stock Alerts" value={lowStockAlerts} onValueChange={setLowStockAlerts} />
          <ToggleRow label="New Order Alerts" value={newOrderAlerts} onValueChange={setNewOrderAlerts} />
          <ToggleRow label="Auto-approve Reviews" value={autoApproveReviews} onValueChange={setAutoApproveReviews} />
          <ToggleRow
            label="Maintenance Mode (demo only)"
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            description="Toggle only — does not actually affect the storefront in this prototype."
          />
        </View>

        <PrimaryButton
          label="Log Out"
          onPress={() => setLogoutVisible(true)}
          icon={<Ionicons name="log-out-outline" size={16} color={colors.textOnPrimary} />}
          style={styles.logoutBtn}
        />
      </ScrollView>

      <AdminSidebarNav visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="AdminSettings" />

      <ConfirmationDialog
        visible={logoutVisible}
        title="Log Out"
        description="You will be returned to the customer app. Continue?"
        confirmLabel="Log Out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
      />
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  description,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadow.sm },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xxs },
  field: { gap: spacing.xxs },
  fieldLabel: { ...typography.captionMedium, color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  toggleLabel: { ...typography.body, color: colors.textPrimary },
  toggleDescription: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  logoutBtn: { backgroundColor: colors.danger },
});
