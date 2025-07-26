import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows } from '../../constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.backgroundWhite,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: Spacing.sm,
          paddingBottom: 6,
          height: 64,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: FontWeight.medium,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lend"
        options={{
          title: 'Lend',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="borrow"
        options={{
          title: 'Borrow',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 