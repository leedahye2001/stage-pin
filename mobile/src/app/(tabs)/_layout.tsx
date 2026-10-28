import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'home' : 'home-outline'} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '일정',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'calendar' : 'calendar-outline'} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="goods"
        options={{
          title: '굿즈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'bag-handle' : 'bag-handle-outline'} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: '로그북',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'book' : 'book-outline'} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: 'MY',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'person' : 'person-outline'} size={23} />
          ),
        }}
      />
    </Tabs>
  );
}
