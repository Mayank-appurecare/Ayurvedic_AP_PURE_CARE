import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { CustomerRepository } from '../../repositories/CustomerRepository';
import { Customer } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

export function AdminCustomersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    CustomerRepository.getAll()
      .then(setCustomers)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    setError(false);
    CustomerRepository.search(query)
      .then(setCustomers)
      .catch(() => setError(true));
  }, [query]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Customers</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {customers === null && !error && <LoadingState label="Loading customers..." />}
      {error && <ErrorState onRetry={load} />}

      {customers !== null && !error && (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or email"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No customers found"
              description="Try a different search term."
            />
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            return (
              <Pressable
                onPress={() => setExpandedId(expanded ? null : item.id)}
                style={styles.row}
                accessibilityRole="button"
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {item.email}
                  </Text>
                  {expanded && (
                    <View style={styles.expanded}>
                      <Text style={styles.detailLine}>Phone: {item.phone}</Text>
                      <Text style={styles.detailLine}>Joined: {formatDate(item.joinedDate)}</Text>
                      <Text style={styles.detailLine}>Orders: {item.totalOrders}</Text>
                      <Text style={styles.detailLine}>
                        Total Spent: {formatPrice(item.totalSpent)}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            );
          }}
        />
      )}

      <AdminSidebarNav
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminCustomers"
      />
    </SafeAreaView>
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
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyMedium, color: colors.primary },
  name: { ...typography.bodyMedium, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textMuted },
  expanded: { marginTop: spacing.xs, gap: 2 },
  detailLine: { ...typography.caption, color: colors.textSecondary },
});
