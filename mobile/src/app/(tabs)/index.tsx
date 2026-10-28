import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { HomeSearch } from '@/components/HomeSearch';
import { HomeHeroCarousel } from '@/components/HomeHeroCarousel';
import { HomeArtists } from '@/components/HomeArtists';
import { TicketingFab } from '@/components/TicketingFab';
import { demoGoods } from '@/lib/goods-demo';
import { colors } from '@/theme/tokens';

export default function FanHomeScreen() {
  const [artist, setArtist] = useState('SEVENTEEN');
  const forArtist = demoGoods.filter((item) => item.artist === artist);
  const exchanges = demoGoods.filter((item) => item.kind === '교환' && item.event);
  const openGoods = (artistFilter = '전체', kindFilter = '전체') => router.push({ pathname: '/goods', params: { artist: artistFilter, kind: kindFilter } });
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={m.content} stickyHeaderIndices={[1]} keyboardShouldPersistTaps="handled">
      <View style={m.between}>
        <View style={m.row}><Image source={require('../../../assets/stagepin-mark.png')} accessibilityLabel="스테이지핀 로고" style={s.brandMark} /><Text style={s.brand}>stagepin<Text style={{ color: colors.primary }}>✦</Text></Text></View>
        <Text style={s.smallLabel}>좋아하는 무대를 핀!</Text>
      </View>
      <HomeSearch />
      <View style={s.sourceNotice}><Ionicons name="information-circle-outline" color={colors.primary} size={16} /><Text style={s.sourceText}>굿즈는 목업 · 아티스트는 공개 API · 예매는 출처 확인 자료</Text></View>
      <HomeHeroCarousel />
      <HomeArtists onSelect={setArtist} />
      <View style={m.section}>
        <View style={m.between}><View><Text style={m.sectionTitle}>같은 무대, 새로운 인연</Text><Text style={m.subtitle}>공연 가는 날, 현장에서 교환해요</Text></View><Pressable accessibilityRole="button" accessibilityLabel="현장 교환 전체 보기" onPress={() => openGoods('전체', '교환')}><Text style={m.link}>전체 보기</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {exchanges.map((item) => <View key={item.id} style={{ width: 174 }}><GoodsCard item={item} /><Text style={s.event}><Ionicons name="location-outline" size={10} /> {item.event}</Text></View>)}
        </ScrollView>
      </View>
      <View style={m.section}>
        <View style={m.between}><Text style={m.sectionTitle}>{artist}의 작은 보물들</Text><Pressable accessibilityRole="button" accessibilityLabel={`${artist} 굿즈 전체 보기`} onPress={() => openGoods(artist)}><Text style={m.link}>더 보기</Text></Pressable></View>
        <View style={m.grid}>{forArtist.map((item) => <View key={item.id} style={m.gridItem}><GoodsCard item={item} /></View>)}</View>
        {!forArtist.length ? <View style={m.empty}><Text style={m.subtitle}>이 아티스트의 목업 굿즈는 아직 없어요.</Text><Pressable accessibilityRole="button" onPress={() => openGoods()}><Text style={m.link}>전체 굿즈 둘러보기</Text></Pressable></View> : null}
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/logbook')} style={s.logBanner}><View><Text style={s.logTitle}>오늘의 덕질도, 소중한 한 페이지</Text><Text style={m.subtitle}>무대의 기억을 로그북에 모아봐요</Text></View><Ionicons name="book-outline" size={30} color={colors.primary} /></Pressable>
      <Text style={s.footer}>팬이 만든 연결, STAGEPIN · 화면 검증용 목업</Text>
    </ScrollView>
    <TicketingFab />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  brandMark: { width: 31, height: 34, borderRadius: 11, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  brand: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -1 },
  smallLabel: { fontSize: 10, color: colors.textMuted },
  sourceNotice: { backgroundColor: '#EEE8FA', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  sourceText: { fontSize: 9, color: '#7B6996', lineHeight: 17, flex: 1 },
  event: { fontSize: 9, color: colors.primary, paddingTop: 8, lineHeight: 15 },
  logBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFEAF6', padding: 18, borderRadius: 20, gap: 8 },
  logTitle: { color: '#514262', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  footer: { color: '#A59BAD', fontSize: 9, textAlign: 'center' },
});
