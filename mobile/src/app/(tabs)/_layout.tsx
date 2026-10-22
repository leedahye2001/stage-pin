import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function TabLayout() {
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
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '공연',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'map' : 'map-outline'} size={23} />
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
