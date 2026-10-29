import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarGlass } from '@/components/TabBarGlass';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();

  return (
    <Tabs
      tabBar={isWide ? () => null : undefined}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: 'rgba(108,76,241,0.08)',
        tabBarBackground: () => <TabBarGlass />,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarItemStyle: { flex: 1, borderRadius: 28, margin: 0, padding: 0, overflow: 'hidden' },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 32,
          height: 64,
          width: '92%',
          maxWidth: 390,
          alignSelf: 'center',
          marginTop: 8,
          marginBottom: Math.max(insets.bottom, 12),
          padding: 4,
          paddingTop: 4,
          paddingBottom: 4,
          shadowColor: '#9174CE',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 18,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'map' : 'map-outline'} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '일정',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'calendar' : 'calendar-outline'} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'home' : 'home-outline'} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="goods"
        options={{
          title: '굿즈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'bag-handle' : 'bag-handle-outline'} size={21} />
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
            <Ionicons color={color as string} name={focused ? 'person' : 'person-outline'} size={21} />
          ),
        }}
      />
    </Tabs>
  );
}
