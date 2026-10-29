import { router, usePathname } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { HomeSearch } from '@/components/HomeSearch';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';
import { colors } from '@/theme/tokens';

const menus = [
  { label: '지도', path: '/explore' }, { label: '일정', path: '/schedule' },
  { label: '홈', path: '/' }, { label: '굿즈', path: '/goods' }, { label: 'MY', path: '/my' },
] as const;

export function DesktopHeader() {
  const { isWide, isDesktop } = useResponsiveLayout();
  const pathname = usePathname();
  if (!isWide) return null;
  return <View style={s.header}>
    <View style={s.top}>
      <Pressable accessibilityRole="link" accessibilityLabel="StagePin 홈" onPress={() => router.push('/')} style={s.brand}>
        <Image source={require('../../assets/stagepin-mark.png')} style={s.mark} /><Text style={s.name}>stagepin<Text style={{ color: colors.primary }}>✦</Text></Text>
      </Pressable>
      <View style={[s.search, !isDesktop && { maxWidth: 400 }]}><HomeSearch /></View>
      <Pressable accessibilityRole="link" onPress={() => router.push('/goods/create')} style={s.register}><Text style={s.registerText}>＋ 굿즈 등록</Text></Pressable>
    </View>
    <View accessibilityRole="tablist" style={s.navigation}>{menus.map(menu => {
      const selected = menu.path === '/' ? pathname === '/' : pathname.startsWith(menu.path);
      return <Pressable key={menu.path} accessibilityRole="tab" accessibilityLabel={`${menu.label} 메뉴`} accessibilityState={{ selected }} onPress={() => router.push(menu.path)} style={[s.item, selected && s.selected]}><Text style={[s.label, selected && { color: colors.primary }]}>{menu.label}</Text></Pressable>;
    })}</View>
  </View>;
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, zIndex: 20 },
  top: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 28, zIndex: 2 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, mark: { width: 30, height: 34 }, name: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -1 },
  search: { flex: 1, maxWidth: 580 }, register: { marginLeft: 'auto', padding: 12, borderRadius: 24, backgroundColor: colors.button }, registerText: { fontSize: 12, fontWeight: '700', color: colors.buttonText },
  navigation: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 32, flexDirection: 'row', gap: 36 },
  item: { paddingHorizontal: 12, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent' }, selected: { borderBottomColor: colors.primary }, label: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
