import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useStore } from '../../store';

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  in_progress: '#9c27b0',
  completed: '#4caf50',
  cancelled: '#f44336',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, setOrders } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await api.get<any[]>('/orders');
      setOrders(data);
    } catch {
      // Silently fail, user can pull to refresh
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b4513"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[item.status] || '#999' },
                  ]}
                >
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.orderItems}>
              {item.items?.length || 0} item(s)
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.orderTotal}>{item.total?.toFixed(2)} $</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3e2723',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItems: {
    fontSize: 13,
    color: '#8d6e63',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: '#a1887f',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b4513',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#8d6e63',
  },
});
