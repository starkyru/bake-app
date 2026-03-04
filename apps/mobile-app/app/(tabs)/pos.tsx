import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { useStore } from '../../store';

export default function POSScreen() {
  const { products, setProducts, cart, addToCart, clearCart } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await api.get<{ data: any[] }>('/v1/products?limit=100');
      setProducts(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) return;

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      await api.post('/v1/orders', {
        items: orderItems,
        type: 'dine_in',
      });

      clearCart();
      Alert.alert('Success', 'Order created successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create order');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>
              {item.price?.toFixed(2)} $
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No products available</Text>
          ) : null
        }
      />

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </Text>
            <Text style={styles.cartTotal}>{cartTotal.toFixed(2)} $</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  grid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3e2723',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#8d6e63',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  productPrice: {
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
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cartInfo: {
    flex: 1,
  },
  cartCount: {
    fontSize: 13,
    color: '#8d6e63',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e2723',
  },
  checkoutBtn: {
    backgroundColor: '#8b4513',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
