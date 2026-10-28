import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme/tokens';

export function GoodsFab() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="굿즈 판매·교환 글 등록"
      onPress={() => router.push('/goods/create')} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}>
      <Ionicons name="add" color={colors.white} size={24} />
      <Text style={styles.label}>굿즈 등록</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 18, minHeight: 56,
    borderWidth: 2, borderColor: '#DDD5FF', boxShadow: '0px 6px 20px rgba(86, 53, 198, 0.25)' },
  label: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
