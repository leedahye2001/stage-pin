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
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout, responsiveStyles } from '@/lib/use-responsive-layout';

export default function FanHomeScreen() {
  const layout = useResponsiveLayout();
  const [kind, setKind] = useState('전체');
  const { items } = useGoodsDemo();
  const goods = items.filter((item) => kind === '전체' || item.kind === kind).slice(0, layout.isDesktop ? 8 : 6);
  const exchanges = items.filter((item) => item.kind === '교환' && item.event && item.methods.includes('현장'));
  const openGoods = (artistFilter = '전체', kindFilter = '전체', onsite = false) => router.push({ pathname: '/goods', params: { artist: artistFilter, kind: kindFilter, method: onsite ? '현장' : '' } });
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={[m.content, layout.isWide && responsiveStyles.content]} stickyHeaderIndices={layout.isWide ? [] : [1]} keyboardShouldPersistTaps="handled">
      <View style={[m.between, layout.isWide && { display: 'none' }]}>
        <View style={m.row}><Image source={require('../../../assets/stagepin-mark.png')} accessibilityLabel="스테이지핀 로고" style={s.brandMark} /><Text style={s.brand}>stagepin<Text style={{ color: colors.primary }}>✦</Text></Text></View>
        <Text style={s.smallLabel}>공연과 굿즈가 만나는 곳</Text>
      </View>
      {!layout.isWide ? <HomeSearch /> : null}
      <HomeHeroCarousel />
      <HomeArtists />
      <HomeStageSchedule />
      <View style={m.section}>
        <View style={m.between}><Text style={m.sectionTitle}>새로 올라온 굿즈</Text><Pressable accessibilityRole="button" accessibilityLabel="굿즈 전체 보기" onPress={() => openGoods('전체', kind)}><Text style={m.sectionLink}>{'전체 보기 >'}</Text></Pressable></View>
        <View style={m.row}>{['전체', '판매', '교환'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`홈 ${value} 굿즈 보기`} accessibilityState={{ selected: kind === value }} onPress={() => setKind(value)} style={[m.chip, kind === value && m.chipSelected]}><Text style={[m.chipText, kind === value && m.chipSelectedText]}>{value}</Text></Pressable>)}</View>
        <View style={m.grid}>{goods.map((item) => <View key={item.id} style={[m.gridItem, layout.isWide && { width: layout.cardWidth, maxWidth: layout.cardWidth, flexGrow: 0 }]}><GoodsCard item={item} /></View>)}</View>
      </View>
      <View style={s.onsite}>
        <View style={m.between}><Text style={m.sectionTitle}>공연 가는 날, 여기서 만나요</Text><Pressable accessibilityRole="button" accessibilityLabel="현장 교환 전체 보기" onPress={() => openGoods('전체', '교환', true)}><Text style={m.sectionLink}>{'전체 보기 >'}</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {exchanges.map((item) => <View key={item.id} style={{ width: 174 }}><GoodsCard item={item} /><Text style={s.event}><Ionicons name="location-outline" size={10} /> {item.event}</Text></View>)}
        </ScrollView>
      </View>
      <Text style={s.footer}>공연 정보와 사진의 원출처는 각 상세에서 확인할 수 있어요.{`\n`}굿즈는 미리보기이며 실제 거래 기능은 준비 중이에요.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  brandMark: { width: 31, height: 34, borderRadius: 11, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  brand: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -1 },
  smallLabel: { fontSize: 10, color: colors.textMuted },
  onsite: { backgroundColor: colors.surfaceMuted, borderRadius: 24, padding: 17, gap: 17 },
  event: { fontSize: 9, color: colors.primary, paddingTop: 8, lineHeight: 15 },
  footer: { color: '#A59BAD', fontSize: 9, textAlign: 'center', lineHeight: 18 },
});
