import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import type { Concert } from '@/api/concerts';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { concertPhase } from '@/lib/home-concerts';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';

export function HomeHeroCarousel({ concerts, pending }: { concerts: Concert[]; pending: boolean }) {
  const { isWide } = useResponsiveLayout();
  const items = concerts.filter(item => Boolean(item.posterUrl)).slice(0, 5);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [now] = useState(Date.now);
  const pathname = usePathname();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const active = Math.min(page, Math.max(0, items.length - 1));
  const move = (index: number) => {
    setPage(index);
    scroll.current?.scrollTo({ x: index * width, animated: true });
  };
  useEffect(() => {
    if (pathname !== '/' || !width || dragging || paused || items.length < 2) return;
    const timer = setTimeout(() => {
      const next = (active + 1) % items.length;
      setPage(next);
      scroll.current?.scrollTo({ x: next * width, animated: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [pathname, width, active, items.length, dragging, paused]);
  if (pending && !items.length) return <LoadingSkeleton kind="detail" label="공연 포스터 불러오는 중" />;
  if (!items.length) return null;
  return <View style={s.section} onLayout={event => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth(nextWidth);
    scroll.current?.scrollTo({ x: active * nextWidth, animated: false });
  }}>
    <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
      onScrollBeginDrag={() => setDragging(true)} onScrollEndDrag={() => setDragging(false)}
      onMomentumScrollEnd={event => { if (width) setPage(Math.max(0, Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)))); }}>
      {items.map(item => <View key={item.id} style={[s.hero, { width: width || 320 }, isWide && s.heroWide]}>
        <View style={s.info}>
          <Text style={s.badge}>{concertPhase(item, now)}</Text>
          <Text numberOfLines={3} style={[s.title, isWide && s.titleWide]}>{item.title}</Text>
          <Text style={s.meta}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(item.startsAt))}</Text>
          <Text numberOfLines={2} style={s.meta}>{item.venue.name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 공연 보기`}
            onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: item.id, genre: item.genre } })} style={s.cta}>
            <Text style={s.ctaText}>공연 보기</Text><Ionicons name="arrow-forward" size={16} color={colors.buttonText} />
          </Pressable>
        </View>
        <Image source={{ uri: item.posterUrl! }} accessibilityLabel={`${item.title} 포스터`} resizeMode="contain" style={[s.poster, isWide && s.posterWide]} />
      </View>)}
    </ScrollView>
    {items.length > 1 ? <View style={s.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 공연 배너" onPress={() => move((active + items.length - 1) % items.length)} style={s.control}><Ionicons name="chevron-back" size={17} color={colors.text} /></Pressable>
      <Text style={s.counter}>{active + 1} / {items.length}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 공연 배너" onPress={() => move((active + 1) % items.length)} style={s.control}><Ionicons name="chevron-forward" size={17} color={colors.text} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={paused ? '배너 자동 넘김 재생' : '배너 자동 넘김 일시정지'} onPress={() => setPaused(!paused)} style={s.control}><Ionicons name={paused ? 'play' : 'pause'} size={13} color={colors.textMuted} /></Pressable>
    </View> : null}
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 8 },
  hero: { borderRadius: 24, padding: 22, gap: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, minHeight: 280 },
  heroWide: { padding: 40, gap: 48, minHeight: 350 },
  info: { flex: 1, minWidth: 0, gap: 10, alignItems: 'flex-start' },
  badge: { color: colors.primary, backgroundColor: colors.primarySoft, fontSize: 11, fontWeight: '800', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
  title: { color: colors.text, fontSize: 21, fontWeight: '900', lineHeight: 28, letterSpacing: -0.6 },
  titleWide: { fontSize: 31, lineHeight: 42 },
  meta: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  poster: { width: '39%', aspectRatio: 0.7, maxHeight: 230, borderRadius: 12 },
  posterWide: { width: 200, maxHeight: 285 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.white, marginTop: 6 },
  ctaText: { fontSize: 12, fontWeight: '800', color: colors.buttonText },
  controls: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  control: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  counter: { fontSize: 11, color: colors.textMuted, minWidth: 35, textAlign: 'center' },
});
