import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WebAnalytics } from '@/components/WebAnalytics';
import { LaunchIntro } from '@/components/LaunchIntro';
import { DesktopHeader } from '@/components/DesktopHeader';

import { FavoritesProvider } from '@/lib/favorites';
import { GoodsDemoProvider } from '@/lib/goods-demo-state';
import { SavedSchedulesProvider } from '@/lib/saved-schedules-state';
import { queryClient } from '@/lib/query-client';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <GoodsDemoProvider>
            <SavedSchedulesProvider>
            <StatusBar style="dark" />
            <WebAnalytics />
            <LaunchIntro>
            <DesktopHeader />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="concerts/[id]" options={{ title: '공연 상세' }} />
              <Stack.Screen name="artists/[id]" options={{ title: '아티스트' }} />
              <Stack.Screen name="search" options={{ title: '공연 검색' }} />
              <Stack.Screen name="following-concerts" options={{ title: '관심 아티스트 공연' }} />
              <Stack.Screen name="pinlog/create" options={{ title: '핀로그 만들기' }} />
              <Stack.Screen name="admin/notices" options={{ title: 'AI 공연 공지 분석' }} />
              <Stack.Screen name="practice/ticketing" options={{ title: '모의 티켓팅' }} />
              <Stack.Screen name="goods/[id]" options={{ title: '굿즈 상세' }} />
              <Stack.Screen name="goods/create" options={{ title: '굿즈 등록' }} />
            </Stack>
            </LaunchIntro>
            </SavedSchedulesProvider>
          </GoodsDemoProvider>
        </FavoritesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
