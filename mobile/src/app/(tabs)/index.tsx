import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { HomeSearch } from '@/components/HomeSearch';
import { HomeHeroCarousel } from '@/components/HomeHeroCarousel';
import { HomeArtists } from '@/components/HomeArtists';
import { HomeStageSchedule } from '@/components/HomeStageSchedule';
import { GoodsFab } from '@/components/GoodsFab';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';

export default function FanHomeScreen() {
  const [kind, setKind] = useState('전체');
  const { items } = useGoodsDemo();
  const goods = items.filter((item) => kind === '전체' || item.kind === kind).slice(0, 6);
  const exchanges = items.filter((item) => item.kind === '교환' && item.event && item.methods.includes('현장'));
  const openGoods = (artistFilter = '전체', kindFilter = '전체', onsite = false) => router.push({ pathname: '/goods', params: { artist: artistFilter, kind: kindFilter, method: onsite ? '현장' : '' } });
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={m.content} stickyHeaderIndices={[1]} keyboardShouldPersistTaps="handled">
      <View style={m.between}>
        <View style={m.row}><Image source={require('../../../assets/stagepin-mark.png')} accessibilityLabel="스테이지핀 로고" style={s.brandMark} /><Text style={s.brand}>stagepin<Text style={{ color: colors.primary }}>✦</Text></Text></View>
        <Text style={s.smallLabel}>공연과 굿즈가 만나는 곳</Text>
      </View>
      <HomeSearch />
      <HomeHeroCarousel />
      <View style={s.shortcuts}>{([{ icon: 'ticket-outline', title: '공연 찾기', copy: '다음 무대를 찾아요', path: '/explore' }, { icon: 'bag-handle-outline', title: '굿즈 거래', copy: '사고팔고 나눠요', path: '/goods' }, { icon: 'swap-horizontal', title: '현장 교환', copy: '같은 공연에서 만나요', path: '/goods' }] as const).map((item) => <Pressable key={item.title} accessibilityRole="button" onPress={() => item.title === '현장 교환' ? openGoods('전체', '교환', true) : item.title === '굿즈 거래' ? openGoods() : router.push(item.path)} style={s.shortcut}><Ionicons name={item.icon} size={24} color={colors.primary} /><Text style={s.shortcutTitle}>{item.title}</Text><Text style={s.shortcutCopy}>{item.copy}</Text></Pressable>)}</View>
      <HomeArtists />
      <HomeStageSchedule />
      <View style={m.section}>
        <View style={m.between}><View style={{ gap: 6 }}><Text style={m.sectionTitle}>새로 올라온 굿즈</Text><Text style={m.subtitle}>누군가의 보물이 내 최애가 되는 순간</Text></View><Pressable accessibilityRole="button" accessibilityLabel="굿즈 전체 보기" onPress={() => openGoods('전체', kind)}><Text style={m.link}>전체 보기 ↗</Text></Pressable></View>
        <View style={m.row}>{['전체', '판매', '교환'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`홈 ${value} 굿즈 보기`} accessibilityState={{ selected: kind === value }} onPress={() => setKind(value)} style={[m.chip, kind === value && m.chipSelected]}><Text style={[m.chipText, kind === value && m.chipSelectedText]}>{value}</Text></Pressable>)}</View>
        <Text style={s.sample}>샘플·로컬 미리보기 글 · 실제 거래는 진행되지 않아요</Text>
        <View style={m.grid}>{goods.map((item) => <View key={item.id} style={m.gridItem}><GoodsCard item={item} /></View>)}</View>
      </View>
      <View style={s.onsite}>
        <View style={m.between}><View style={{ flex: 1, gap: 6 }}><Text style={s.onsiteTag}>같은 무대에서, 가볍게 교환</Text><Text style={m.sectionTitle}>공연 가는 날, 여기서 만나요</Text><Text style={m.subtitle}>택배 대신 현장에서 · 샘플 교환 글</Text></View><Ionicons name="swap-horizontal" size={29} color="#5B8065" /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {exchanges.map((item) => <View key={item.id} style={{ width: 174 }}><GoodsCard item={item} /><Text style={s.event}><Ionicons name="location-outline" size={10} /> {item.event}</Text></View>)}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="현장 교환 전체 보기" onPress={() => openGoods('전체', '교환', true)}><Text style={m.link}>교환 글 더 보기 ↗</Text></Pressable>
      </View>
      <Text style={s.footer}>좋아하는 무대와 취향을 잇는, stagepin{`\n`}공연 정보와 사진의 원출처는 각 상세에서 확인할 수 있어요.</Text>
    </ScrollView>
    <GoodsFab />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  brandMark: { width: 31, height: 34, borderRadius: 11, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  brand: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -1 },
  smallLabel: { fontSize: 10, color: colors.textMuted },
  shortcuts: { flexDirection: 'row', gap: 9 }, shortcut: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE8F4', borderRadius: 18, paddingVertical: 17, paddingHorizontal: 8, alignItems: 'center', gap: 8 },
  shortcutTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, shortcutCopy: { color: colors.textMuted, fontSize: 9, textAlign: 'center' },
  onsite: { backgroundColor: '#EFF4ED', borderRadius: 24, padding: 17, gap: 17 }, onsiteTag: { color: '#5B8065', fontSize: 10, fontWeight: '800' },
  sample: { color: '#91859C', fontSize: 10 },
  event: { fontSize: 9, color: colors.primary, paddingTop: 8, lineHeight: 15 },
  footer: { color: '#A59BAD', fontSize: 9, textAlign: 'center', lineHeight: 18 },
});
