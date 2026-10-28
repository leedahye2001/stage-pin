import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '@/theme/tokens';

const banners = [
  { title: '무대를 찾고,\n취향을 나누는 곳.', copy: '공연 일정부터 굿즈, 현장 교환까지 한 번에.', tag: '나의 다음 덕질을 핀!', cta: '다음 공연 찾아보기', route: '/explore', color: '#EEE8FD', accent: '#6C4CF1', mark: '✦' },
  { title: '같은 공연,\n새로운 굿즈 친구.', copy: '갖고 싶은 굿즈를 찾고, 현장에서 마음을 교환해요.', tag: '팬과 팬 사이, stagepin', cta: '굿즈장터 둘러보기', route: '/goods', color: '#E7EFE5', accent: '#4F785C', mark: '♡' },
] as const;

export function HomeHeroCarousel() {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  return <View style={{ gap: 11 }} onLayout={(event) => { const nextWidth = event.nativeEvent.layout.width; setWidth(nextWidth); scroll.current?.scrollTo({ x: page * nextWidth, animated: false }); }}>
    <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => { if (width) setPage(Math.round(event.nativeEvent.contentOffset.x / width)); }}>
      {banners.map((item) => <View key={item.title} style={[s.hero, { width: width || 320, backgroundColor: item.color }]}>
        <Text style={[s.tag, { color: item.accent }]}>{item.tag}</Text><Text style={s.title}>{item.title}</Text><Text style={s.copy}>{item.copy}</Text>
        <View style={s.art}><Text style={[s.mark, { color: item.accent }]}>{item.mark}</Text><View style={[s.card, { borderColor: item.accent }]}><Text style={[s.cardText, { color: item.accent }]}>MY{`\n`}FAVE</Text></View></View>
        <Pressable accessibilityRole="button" onPress={() => router.push(item.route)} style={[s.cta, { backgroundColor: item.accent }]}><Text style={s.ctaText}>{item.cta}</Text><Ionicons name="arrow-forward" size={16} color="#FFFFFF" /></Pressable>
      </View>)}
    </ScrollView>
    <View style={s.controls}>{banners.map((item, index) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${index + 1}번 홈 배너 보기`} accessibilityState={{ selected: page === index }} onPress={() => { setPage(index); scroll.current?.scrollTo({ x: index * width, animated: true }); }} style={s.dotTouch}><View style={[s.dot, page === index && s.dotActive]} /></Pressable>)}<Text style={s.counter}>{page + 1} / {banners.length}</Text></View>
  </View>;
}

const s = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, gap: 10, overflow: 'hidden' },
  tag: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '800', backgroundColor: '#FFFFFFAA', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, zIndex: 1 },
  title: { color: '#33264A', fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -1, zIndex: 1 },
  copy: { color: '#80718D', fontSize: 12, lineHeight: 21, zIndex: 1 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20, zIndex: 1 },
  ctaText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  art: { position: 'absolute', width: 130, height: 180, right: -15, top: 70, opacity: 0.16 },
  mark: { fontSize: 60 },
  card: { width: 75, height: 105, borderWidth: 5, borderRadius: 9, transform: [{ rotate: '16deg' }], alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 21, fontWeight: '900' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dotTouch: { padding: 7 },
  dot: { width: 6, height: 6, backgroundColor: '#D6CEDF', borderRadius: 4 },
  dotActive: { width: 18, backgroundColor: colors.primary },
  counter: { position: 'absolute', right: 2, fontSize: 10, color: colors.textMuted },
});
