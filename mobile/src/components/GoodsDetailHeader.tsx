import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

export function GoodsDetailHeader() {
  return <View style={{ backgroundColor: colors.background }}><View style={s.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="이전 화면으로 돌아가기"
      onPress={() => router.canGoBack() ? router.back() : router.replace('/goods')} style={s.back}>
      <Ionicons name="arrow-back" size={20} color={colors.text} />
    </Pressable>
    <Text accessibilityRole="header" style={s.title}>굿즈 상세</Text>
  </View></View>;
}
const s = StyleSheet.create({
  header: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: colors.text },
});
