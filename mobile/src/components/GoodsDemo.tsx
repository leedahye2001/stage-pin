import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type DemoGoods, goodsPrice } from '@/lib/goods-demo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';

export function DemoNotice() {
  return <View style={s.notice}><Ionicons name="information-circle-outline" size={14} color={colors.primary} /><Text style={s.noticeText}>미리보기 · 실제 게시·결제·거래는 진행되지 않아요</Text></View>;
}

export function GoodsArtwork({ item, large = false }: { item: DemoGoods; large?: boolean }) {
  const [selected, setSelected] = useState(0);
  if (item.photos?.length) return <View style={{ gap: 10 }}>
    <Image accessibilityLabel={`${item.title} 실물 사진 ${large ? selected + 1 : 1}`} source={{ uri: (item.photos[large ? selected : 0] ?? item.photos[0]).uri }} resizeMode={large ? 'contain' : 'cover'} style={[s.art, { width: '100%', backgroundColor: '#F0EDF7' }, large && s.artLarge]} />
    {large && item.photos.length > 1 ? <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{item.photos.map((photo, index) => <Pressable key={`${photo.uri}-${index}`} accessibilityRole="button" accessibilityLabel={`실물 사진 ${index + 1} 보기`} accessibilityState={{ selected: selected === index }} onPress={() => setSelected(index)}><Image source={{ uri: photo.uri }} style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 2, borderColor: selected === index ? colors.primary : 'transparent' }} /></Pressable>)}</ScrollView> : null}
  </View>;
  return <View accessibilityLabel={`${item.member} ${item.category} 샘플 일러스트`} style={[s.art, { backgroundColor: item.color }, large && s.artLarge]}>
    <Text style={[s.artStar, { color: item.ink }]}>✧</Text>
    <View style={[s.paper, large && s.paperLarge, { transform: [{ rotate: item.kind === '교환' ? '-8deg' : '7deg' }] }]}>
      <View style={[s.portrait, { backgroundColor: item.color }]}>
        <View style={[s.orbit, { borderColor: item.ink }]} />
        <Text style={[s.monogram, { color: item.ink }, large && { fontSize: 52 }]}>{item.mark}</Text>
        <Text style={[s.tinyStar, { color: item.ink }]}>✦</Text>
      </View>
      <Text style={[s.paperName, { color: item.ink }]}>{item.member}</Text>
      <Text style={s.paperCaption}>MY LITTLE COLLECTION</Text>
    </View>
    <Text style={[s.artDoodle, { color: item.ink }]}>♡</Text>
    <Text style={s.sample}>샘플 일러스트</Text>
  </View>;
}

export function GoodsCard({ item }: { item: DemoGoods }) {
  const { saved, toggleSaved } = useGoodsDemo();
  return <View style={s.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 상세 보기`} onPress={() => router.push({ pathname: '/goods/[id]', params: { id: item.id } })}>
      <GoodsArtwork item={item} />
      <View style={s.cardCopy}>
        <View style={s.row}><Text style={[s.badge, item.kind === '교환' && s.exchange]}>{item.kind}</Text><Text style={s.artist}>{item.artist}</Text></View>
        <Text numberOfLines={2} style={s.cardTitle}>{item.title}</Text>
        <Text style={s.price}>{goodsPrice(item)}</Text>
        <Text numberOfLines={1} style={s.meta}>{item.kind === '교환' ? `구해요 · ${item.wanted}` : item.condition}</Text>
        <Text style={s.meta}>{item.methods.join(' · ')}{item.status === '예약 중' ? ' · 예약 중' : ''}</Text>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 찜`} accessibilityState={{ selected: saved.includes(item.id) }}
      onPress={() => toggleSaved(item.id)} style={s.heart}>
      <Ionicons name={saved.includes(item.id) ? 'heart' : 'heart-outline'} size={19} color={saved.includes(item.id) ? colors.primary : '#635B6A'} />
    </Pressable>
  </View>;
}

export const marketStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9FC' },
  content: { padding: 20, paddingBottom: 110, gap: 24, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  section: { gap: 14 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E5F0', borderRadius: 24 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  chipSelectedText: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridItem: { width: '47%', flexGrow: 1, maxWidth: '49%' },
  empty: { padding: 32, gap: 12, backgroundColor: '#F0EDF7', borderRadius: 20, alignItems: 'center' },
});

const s = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#EEE8FF', borderRadius: 10, padding: 10 },
  noticeText: { color: '#6B53A1', fontSize: 10, lineHeight: 16, flex: 1 },
  art: { height: 175, borderRadius: 17, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  artLarge: { height: 320, borderRadius: 24 },
  artStar: { position: 'absolute', top: 10, left: 15, fontSize: 42, opacity: 0.7 },
  artDoodle: { position: 'absolute', bottom: 25, right: 14, fontSize: 32 },
  paper: { width: 90, height: 125, padding: 7, backgroundColor: '#FFFDF9', borderRadius: 6, boxShadow: '2px 7px 12px #00000016', alignItems: 'center', gap: 4 },
  paperLarge: { width: 157, height: 223, padding: 12, gap: 8 },
  portrait: { flex: 1, width: '100%', borderRadius: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orbit: { position: 'absolute', width: 100, height: 100, borderWidth: 1, borderRadius: 60, opacity: 0.2, transform: [{ scaleX: 0.6 }, { rotate: '25deg' }] },
  monogram: { fontSize: 29, fontWeight: '900', letterSpacing: -1 },
  tinyStar: { position: 'absolute', bottom: 8, right: 8, fontSize: 14 },
  paperName: { fontSize: 9, fontWeight: '900' },
  paperCaption: { fontSize: 4, color: '#8C8492', letterSpacing: 1 },
  sample: { position: 'absolute', bottom: 8, left: 10, fontSize: 8, color: '#625D69' },
  card: { position: 'relative' },
  cardCopy: { paddingTop: 10, gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: '#F0EBFA', paddingHorizontal: 6, paddingVertical: 3, fontSize: 9, color: '#7858AB', fontWeight: '800', borderRadius: 5 },
  exchange: { backgroundColor: '#E5F1E9', color: '#4F8062' },
  artist: { fontSize: 9, color: colors.textMuted, fontWeight: '700' },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 19, minHeight: 38 },
  price: { fontWeight: '900', color: colors.text, fontSize: 15 },
  meta: { fontSize: 10, color: colors.textMuted, lineHeight: 15 },
  heart: { position: 'absolute', right: 8, top: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFFE6', alignItems: 'center', justifyContent: 'center' },
});
