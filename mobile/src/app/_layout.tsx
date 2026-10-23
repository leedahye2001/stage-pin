import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FavoritesProvider } from '@/lib/favorites';
import { queryClient } from '@/lib/query-client';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <StatusBar style="dark" />
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
          </Stack>
        </FavoritesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
