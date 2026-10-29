import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarGlass } from '@/components/TabBarGlass';
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
        tabBarActiveBackgroundColor: 'rgba(108,76,241,0.08)',
        tabBarBackground: () => <TabBarGlass />,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarItemStyle: { borderRadius: 27, marginHorizontal: 3, overflow: 'hidden' },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
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
          shadowColor: '#9174CE',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 18,
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
