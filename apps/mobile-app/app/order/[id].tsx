import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  in_progress: '#9c27b0',
  completed: '#4caf50',
  cancelled: '#f44336',
};

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  type: string;
  createdAt: string;
  items: {
    id: string;
    product?: { name: string };
    quantity: number;
    price: number;
  }[];
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      const data = await api.get<OrderDetail>(`/v1/orders/${id}`);
      setOrder(data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8b4513" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#999';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Type</Text>
        <Text style={styles.metaValue}>
          {order.type?.replace('_', ' ') || '—'}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Date</Text>
        <Text style={styles.metaValue}>
          {new Date(order.createdAt).toLocaleString()}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Items</Text>

      <FlatList
        data={order.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name || 'Unknown'}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {(item.price * item.quantity).toFixed(2)} $
            </Text>
          </View>
        )}
      />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{order.total?.toFixed(2)} $</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#8d6e63',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3e2723',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  metaLabel: {
    fontSize: 14,
    color: '#8d6e63',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3e2723',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3e2723',
    marginTop: 20,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3e2723',
  },
  itemQty: {
    fontSize: 13,
    color: '#8d6e63',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b4513',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: '#8b4513',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e2723',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8b4513',
  },
});
