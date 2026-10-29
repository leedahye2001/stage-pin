import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';

const banners = [
  { title: '무대를 찾고,\n취향을 나누는 곳.', cta: '다음 공연 찾아보기', route: '/explore', color: '#F5F5F6', accent: '#6C4CF1', mark: '✦' },
  { title: '같은 공연,\n새로운 굿즈 친구.', cta: '굿즈장터 둘러보기', route: '/goods', color: '#F5F5F6', accent: '#6C4CF1', mark: '♡' },
] as const;

export function HomeHeroCarousel() {
  const { isWide } = useResponsiveLayout();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const pathname = usePathname();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (pathname !== '/' || !width || dragging || paused) return;
    const timer = setTimeout(() => {
      const next = (page + 1) % banners.length;
      setPage(next);
      scroll.current?.scrollTo({ x: next * width, animated: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [pathname, width, page, dragging, paused]);
  return <View style={{ gap: 11 }} onLayout={(event) => { const nextWidth = event.nativeEvent.layout.width; setWidth(nextWidth); scroll.current?.scrollTo({ x: page * nextWidth, animated: false }); }}>
    <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => setDragging(true)} onScrollEndDrag={() => setDragging(false)} onMomentumScrollEnd={(event) => { if (width) setPage(Math.max(0, Math.min(banners.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)))); }}>
      {banners.map((item) => <View key={item.title} style={[s.hero, { width: width || 320, backgroundColor: item.color }, isWide && { padding: 40, minHeight: 300, justifyContent: 'center', gap: 24 }]}>
        <Text style={[s.title, isWide && { fontSize: 36, lineHeight: 48 }]}>{item.title}</Text>
        <View style={[s.art, isWide && { right: 120, top: 50, transform: [{ scale: 1.6 }] }]}><Text style={[s.mark, { color: item.accent }]}>{item.mark}</Text><View style={[s.card, { borderColor: item.accent }]}><Text style={[s.cardText, { color: item.accent }]}>MY{`\n`}FAVE</Text></View></View>
        <Pressable accessibilityRole="button" onPress={() => router.push(item.route)} style={s.cta}><Text style={s.ctaText}>{item.cta}</Text><Ionicons name="arrow-forward" size={16} color={colors.buttonText} /></Pressable>
      </View>)}
    </ScrollView>
    {isWide ? <View pointerEvents="box-none" style={s.arrows}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 홈 배너" onPress={() => { const next = (page + banners.length - 1) % banners.length; setPage(next); scroll.current?.scrollTo({ x: next * width, animated: true }); }} style={s.arrow}><Ionicons name="chevron-back" size={19} color={colors.text} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 홈 배너" onPress={() => { const next = (page + 1) % banners.length; setPage(next); scroll.current?.scrollTo({ x: next * width, animated: true }); }} style={s.arrow}><Ionicons name="chevron-forward" size={19} color={colors.text} /></Pressable>
    </View> : null}
    <View style={s.controls}>{banners.map((item, index) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${index + 1}번 홈 배너 보기`} accessibilityState={{ selected: page === index }} onPress={() => { setPage(index); scroll.current?.scrollTo({ x: index * width, animated: true }); }} style={s.dotTouch}><View style={[s.dot, page === index && s.dotActive]} /></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={paused ? '배너 자동 넘김 재생' : '배너 자동 넘김 일시정지'} onPress={() => setPaused(!paused)} style={s.dotTouch}><Ionicons name={paused ? 'play' : 'pause'} size={12} color={colors.textMuted} /></Pressable><Text style={s.counter}>{page + 1} / {banners.length}</Text></View>
  </View>;
}

const s = StyleSheet.create({
  arrows: { position: 'absolute', top: 130, left: -18, right: -18, flexDirection: 'row', justifyContent: 'space-between' },
  arrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  hero: { borderRadius: 24, padding: 20, gap: 10, overflow: 'hidden' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -1, zIndex: 1 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20, zIndex: 1, backgroundColor: '#E8E8EB' },
  ctaText: { fontSize: 11, fontWeight: '800', color: colors.buttonText },
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
