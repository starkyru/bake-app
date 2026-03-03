import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../services/api';
import { useStore } from '../../store';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  lowStockItems: number;
}

export default function DashboardScreen() {
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.get<DashboardStats>('/reporting/dashboard');
      setStats(data);
    } catch {
      // Use default stats
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hello, {user?.name || 'Manager'}</Text>
      <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={[styles.statValue, { color: '#2e7d32' }]}>
            {stats.todayOrders}
          </Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={[styles.statValue, { color: '#1565c0' }]}>
            {stats.todayRevenue.toFixed(0)} ₸
          </Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
          <Text style={[styles.statValue, { color: '#e65100' }]}>
            {stats.pendingOrders}
          </Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fce4ec' }]}>
          <Text style={[styles.statValue, { color: '#c62828' }]}>
            {stats.lowStockItems}
          </Text>
          <Text style={styles.statLabel}>Low Stock Items</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3e2723',
    marginBottom: 4,
  },
  role: {
    fontSize: 13,
    color: '#8b4513',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    padding: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6d4c41',
  },
});
