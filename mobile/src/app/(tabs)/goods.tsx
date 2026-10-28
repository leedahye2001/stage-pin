import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoNotice, GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { demoArtists, demoGoods, filterDemoGoods } from '@/lib/goods-demo';
import { colors } from '@/theme/tokens';

export default function GoodsScreen() {
  const params = useLocalSearchParams<{ artist?: string; kind?: string }>();
  const artist = demoArtists.some((item) => item.name === params.artist) ? params.artist! : '전체';
  const kind = params.kind === '교환' || params.kind === '판매' ? params.kind : '전체';
  const setArtist = (value: string) => router.setParams({ artist: value });
  const setKind = (value: string) => router.setParams({ kind: value });
  const [query, setQuery] = useState('');
  const items = filterDemoGoods(demoGoods, artist, kind, query);
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={m.content}>
      <View style={m.between}><View style={{ gap: 7 }}><Text style={s.eyebrow}>FAN TO FAN</Text><Text style={m.title}>취향이 만나는 굿즈장터</Text><Text style={m.subtitle}>내 작은 보물이, 누군가의 최애가 되는 곳</Text></View><Ionicons name="bag-handle-outline" size={30} color={colors.primary} /></View>
      <DemoNotice />
      <View style={s.search}><Ionicons name="search" size={19} color="#92889F" /><TextInput accessibilityLabel="굿즈 검색" placeholder="아티스트, 멤버, 찾는 굿즈를 검색해요" placeholderTextColor="#948B9E" value={query} onChangeText={setQuery} style={s.input} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="굿즈 검색어 지우기" onPress={() => setQuery('')}><Ionicons name="close-circle" color="#92889F" size={18} /></Pressable> : null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.chips}>{['전체', ...demoArtists.map((item) => item.name)].map((name) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${name} 굿즈 필터`} accessibilityState={{ selected: artist === name }} onPress={() => setArtist(name)} style={[m.chip, artist === name && m.chipSelected]}><Text style={[m.chipText, artist === name && m.chipSelectedText]}>{name}</Text></Pressable>)}</ScrollView>
      <View style={s.tip}><Ionicons name="swap-horizontal" size={22} color="#628570" /><View style={{ flex: 1 }}><Text style={s.tipTitle}>같은 공연에 가나요?</Text><Text style={s.tipCopy}>현장 교환으로 배송 걱정 없이 마음을 나눠요.</Text></View><Text style={s.tipStar}>✦</Text></View>
      <View style={m.between}><View style={s.modes}>{['전체', '교환', '판매'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} 거래 유형`} accessibilityState={{ selected: kind === value }} onPress={() => setKind(value)} style={[s.mode, kind === value && s.modeSelected]}><Text style={[s.modeText, kind === value && { color: colors.text }]}>{value}</Text></Pressable>)}</View><Text style={m.subtitle}>{items.length}개의 굿즈 · 샘플</Text></View>
      {items.length ? <View style={m.grid}>{items.map((item) => <View key={item.id} style={m.gridItem}><GoodsCard item={item} /></View>)}</View> : <View style={m.empty}><Ionicons name="search-outline" color={colors.primary} size={30} /><Text style={m.sectionTitle}>아직 이 굿즈는 없어요</Text><Text style={m.subtitle}>검색어나 아티스트 필터를 바꿔보세요.</Text><Pressable accessibilityRole="button" onPress={() => { setQuery(''); setArtist('전체'); setKind('전체'); }}><Text style={m.link}>필터 초기화</Text></Pressable></View>}
      <Text style={s.footer}>사진·가격·닉네임은 가상 데이터입니다.{`\n`}등록·채팅·실제 거래는 다음 단계에서 연결돼요.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 10, letterSpacing: 2, color: colors.primary, fontWeight: '900' },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#F0EDF5', paddingHorizontal: 15, borderRadius: 15, minHeight: 49 },
  input: { flex: 1, paddingVertical: 14, fontSize: 12, color: colors.text, minWidth: 0 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#EDF3EC', borderRadius: 17, padding: 16 },
  tipTitle: { color: '#53715C', fontSize: 13, fontWeight: '800', marginBottom: 5 },
  tipCopy: { color: '#7D9181', fontSize: 10, lineHeight: 16 },
  tipStar: { fontSize: 27, color: '#9AB394' },
  modes: { flexDirection: 'row', gap: 16 },
  mode: { paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeSelected: { borderBottomColor: colors.primary },
  modeText: { color: '#AAA2B2', fontWeight: '800', fontSize: 15 },
  footer: { fontSize: 10, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
