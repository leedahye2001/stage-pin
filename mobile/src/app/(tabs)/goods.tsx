import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoNotice, GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { demoArtists, filterDemoGoods } from '@/lib/goods-demo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { GoodsFab } from '@/components/GoodsFab';
import { colors } from '@/theme/tokens';

export default function GoodsScreen() {
  const params = useLocalSearchParams<{ artist?: string; kind?: string; method?: string }>();
  const onsiteOnly = params.method === '현장';
  const { items: listings } = useGoodsDemo();
  const artistNames = [...new Set([...demoArtists.map((item) => item.name), ...listings.map((item) => item.artist)])];
  const artist = artistNames.includes(params.artist ?? '') ? params.artist! : '전체';
  const kind = params.kind === '교환' || params.kind === '판매' ? params.kind : '전체';
  const setArtist = (value: string) => router.setParams({ artist: value });
  const setKind = (value: string) => router.setParams({ kind: value });
  const [query, setQuery] = useState('');
  const items = filterDemoGoods(listings, artist, kind, query, onsiteOnly);
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={m.content}>
      <View style={m.between}><View style={{ gap: 7 }}><Text style={s.eyebrow}>FAN TO FAN</Text><Text style={m.title}>취향이 만나는 굿즈장터</Text><Text style={m.subtitle}>내 작은 보물이, 누군가의 최애가 되는 곳</Text></View><Ionicons name="bag-handle-outline" size={30} color={colors.primary} /></View>
      <DemoNotice />
      <View style={s.search}><Ionicons name="search" size={19} color="#92889F" /><TextInput accessibilityLabel="굿즈 검색" placeholder="아티스트, 멤버, 찾는 굿즈를 검색해요" placeholderTextColor="#948B9E" value={query} onChangeText={setQuery} style={s.input} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="굿즈 검색어 지우기" onPress={() => setQuery('')}><Ionicons name="close-circle" color="#92889F" size={18} /></Pressable> : null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.chips}>{['전체', ...artistNames].map((name) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${name} 굿즈 필터`} accessibilityState={{ selected: artist === name }} onPress={() => setArtist(name)} style={[m.chip, artist === name && m.chipSelected]}><Text style={[m.chipText, artist === name && m.chipSelectedText]}>{name}</Text></Pressable>)}</ScrollView>
      <View style={s.tip}><Ionicons name="swap-horizontal" size={22} color="#628570" /><View style={{ flex: 1 }}><Text style={s.tipTitle}>같은 공연에 가나요?</Text><Text style={s.tipCopy}>현장 교환으로 배송 걱정 없이 마음을 나눠요.</Text></View><Text style={s.tipStar}>✦</Text></View>
      <Pressable accessibilityRole="checkbox" accessibilityLabel="현장 거래 굿즈만 보기" accessibilityState={{ checked: onsiteOnly }} onPress={() => router.setParams({ method: onsiteOnly ? '' : '현장' })} style={m.row}><Ionicons name={onsiteOnly ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} /><Text style={m.subtitle}>공연 현장 거래만 보기</Text></Pressable>
      <View style={m.between}><View style={s.modes}>{['전체', '교환', '판매'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} 거래 유형`} accessibilityState={{ selected: kind === value }} onPress={() => setKind(value)} style={[s.mode, kind === value && s.modeSelected]}><Text style={[s.modeText, kind === value && { color: colors.text }]}>{value}</Text></Pressable>)}</View><Text style={m.subtitle}>{items.length}개의 굿즈 · 샘플</Text></View>
      {items.length ? <View style={m.grid}>{items.map((item) => <View key={item.id} style={m.gridItem}><GoodsCard item={item} /></View>)}</View> : <View style={m.empty}><Ionicons name="search-outline" color={colors.primary} size={30} /><Text style={m.sectionTitle}>아직 이 굿즈는 없어요</Text><Text style={m.subtitle}>검색어나 아티스트 필터를 바꿔보세요.</Text><Pressable accessibilityRole="button" onPress={() => { setQuery(''); router.setParams({ artist: '전체', kind: '전체', method: '' }); }}><Text style={m.link}>필터 초기화</Text></Pressable></View>}
      <Text style={s.footer}>샘플과 로컬 등록 글을 보여드려요.{`\n`}새로고침 시 초기화 · 실제 게시·채팅·거래는 아직 연결되지 않았어요.</Text>
    </ScrollView>
    <GoodsFab />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 10, letterSpacing: 2, color: colors.primary, fontWeight: '900' },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surfaceMuted, paddingHorizontal: 18, borderRadius: 999, minHeight: 49 },
  input: { flex: 1, paddingVertical: 14, fontSize: 12, color: colors.text, minWidth: 0 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 17, padding: 16 },
  tipTitle: { color: colors.buttonText, fontSize: 13, fontWeight: '800', marginBottom: 5 },
  tipCopy: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  tipStar: { fontSize: 27, color: '#C3C4C8' },
  modes: { flexDirection: 'row', gap: 16 },
  mode: { paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeSelected: { borderBottomColor: colors.primary },
  modeText: { color: '#AAA2B2', fontWeight: '800', fontSize: 15 },
  footer: { fontSize: 10, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
