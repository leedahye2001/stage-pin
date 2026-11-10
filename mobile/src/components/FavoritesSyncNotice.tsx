import { Pressable, Text, View } from 'react-native';
import { useFavorites } from '@/lib/favorites';
import { colors } from '@/theme/tokens';

export function FavoritesSyncNotice() {
  const { error, retry, busy } = useFavorites();
  if (!error) return null;
  return <View style={{ backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 }}>
    <Text accessibilityRole="alert" style={{ color: colors.text }}>{error}</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={retry}>
      <Text style={{ color: colors.primary }}>다시 확인</Text>
    </Pressable>
  </View>;
}
