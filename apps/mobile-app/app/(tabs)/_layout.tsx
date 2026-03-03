import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useStore } from '../../store';

const MANAGER_ROLES = ['owner', 'manager'];
const POS_ROLES = ['owner', 'manager', 'barista', 'cashier'];

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <Text style={{ color, fontSize: size * 0.5, fontWeight: '700' }}>
      {name}
    </Text>
  );
}

export default function TabLayout() {
  const { user } = useStore();
  const role = user?.role || '';

  const showPOS = POS_ROLES.includes(role);
  const showInventory = MANAGER_ROLES.includes(role);
  const showDashboard = MANAGER_ROLES.includes(role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8b4513',
        tabBarInactiveTintColor: '#a1887f',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#8b4513',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ color, size }) => <TabIcon name="POS" color={color} size={size} />,
          href: showPOS ? '/(tabs)/pos' : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="ORD" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="INV" color={color} size={size} />
          ),
          href: showInventory ? '/(tabs)/inventory' : null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="DSH" color={color} size={size} />
          ),
          href: showDashboard ? '/(tabs)/dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="PRF" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
