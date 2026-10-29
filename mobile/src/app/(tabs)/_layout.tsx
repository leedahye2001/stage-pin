import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarItemStyle: { borderRadius: 27, marginHorizontal: 3, overflow: 'hidden' },
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderColor: '#FFFFFF',
          borderWidth: 2,
          borderTopWidth: 2,
          borderRadius: 36,
          height: 72,
          width: '92%',
          maxWidth: 600,
          alignSelf: 'center',
          marginTop: 8,
          marginBottom: Math.max(insets.bottom, 12),
          padding: 5,
          paddingTop: 5,
          paddingBottom: 5,
          shadowColor: '#332052',
          shadowOpacity: 0.14,
          shadowOffset: { width: 0, height: 7 },
          shadowRadius: 20,
          elevation: 8,
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
          href: null,
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
