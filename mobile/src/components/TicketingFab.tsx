import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme/tokens';

export function TicketingFab() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="모의 티켓팅 연습하기"
      onPress={() => router.push('/practice/ticketing')} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}>
      <Ionicons name="ticket" color={colors.white} size={22} />
      <Text style={styles.label}>모의 티켓팅</Text>
      <Text style={styles.sparkle}>✦</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 18, minHeight: 56,
    borderWidth: 2, borderColor: '#DDD5FF', boxShadow: '0px 6px 20px rgba(86, 53, 198, 0.25)' },
  label: { color: colors.white, fontSize: 13, fontWeight: '900' },
  sparkle: { color: '#FFE6A7', fontSize: 18 },
});
