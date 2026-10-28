import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoNotice, GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { TicketingFab } from '@/components/TicketingFab';
import { demoArtists, demoGoods } from '@/lib/goods-demo';
import { colors } from '@/theme/tokens';

export default function FanHomeScreen() {
  const [artist, setArtist] = useState('SEVENTEEN');
  const selected = demoArtists.find((item) => item.name === artist)!;
  const forArtist = demoGoods.filter((item) => item.artist === artist);
  const exchanges = demoGoods.filter((item) => item.kind === '교환' && item.event);
  const openGoods = (artistFilter = '전체', kindFilter = '전체') => router.push({ pathname: '/goods', params: { artist: artistFilter, kind: kindFilter } });
  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={m.content}>
      <View style={m.between}>
        <View style={m.row}><Image source={require('../../../assets/stagepin-mark.png')} accessibilityLabel="스테이지핀 로고" style={s.brandMark} /><Text style={s.brand}>stagepin<Text style={{ color: colors.primary }}>✦</Text></Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="기존 공연 검색 열기" onPress={() => router.push('/explore')} style={s.searchIcon}><Ionicons name="search" size={22} color={colors.text} /></Pressable>
      </View>
      <DemoNotice />
      <View style={s.hero}>
        <View style={s.heroStamp}><Ionicons name="heart" size={12} color={colors.primary} /><Text style={s.heroStampText}>좋아하는 마음이 만나는 곳</Text></View>
        <Text style={s.heroTitle}>무대에서 만나고,{`\n`}취향으로 연결돼요.</Text>
        <Text style={s.heroCopy}>기다리던 공연부터 갖고 싶던 포카까지.{`\n`}우리의 덕질을 한곳에 핀!</Text>
        <View style={s.heroDecor}><Text style={s.heroStar}>✦</Text><View style={s.miniCard}><Text style={s.miniCardText}>MY{`\n`}FAVE{`\n`}♡</Text></View><Text style={s.heroDot}>✧</Text></View>
        <Pressable accessibilityRole="button" onPress={() => openGoods()} style={s.heroButton}><Text style={s.heroButtonText}>내 취향 굿즈 찾기</Text><Ionicons name="arrow-forward" size={16} color="#FFFFFF" /></Pressable>
      </View>
      <View style={m.section}>
        <View style={m.between}><Text style={m.sectionTitle}>오늘도, 최애와 함께</Text><Text style={s.smallLabel}>아티스트를 골라봐요</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.artists}>
          {demoArtists.map((item) => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={`${item.name} 선택`} accessibilityState={{ selected: artist === item.name }} onPress={() => setArtist(item.name)} style={s.artistItem}>
            <View style={[s.artistCircle, { backgroundColor: item.color }, artist === item.name && s.artistSelected]}><Text style={[s.artistInitial, { color: item.ink }]}>{item.short}</Text>{artist === item.name ? <View style={s.artistHeart}><Ionicons name="heart" color="#FFFFFF" size={10} /></View> : null}</View>
            <Text style={[s.artistLabel, artist === item.name && { color: colors.primary }]}>{item.name}</Text>
          </Pressable>)}
        </ScrollView>
      </View>
      <View style={[s.ticket, { backgroundColor: selected.color }]}>
        <View style={m.row}><Ionicons name="ticket-outline" size={18} color={selected.ink} /><Text style={[s.ticketEyebrow, { color: selected.ink }]}>다가오는 예매 · 가상 일정</Text></View>
        <View style={m.between}><View style={{ flex: 1, gap: 7 }}><Text style={s.ticketTitle}>{artist} FAN DAY</Text><Text style={s.ticketCopy}>11.06 (금) 20:00 · 팬클럽 선예매</Text><Text style={s.ticketCopy}>가상 팬콘 · KSPO DOME · 예매처 예시 NOL</Text></View><View style={s.dateStamp}><Text style={s.dateMonth}>NOV</Text><Text style={s.dateDay}>06</Text></View></View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/schedule')} style={s.ticketLink}><Text style={{ color: selected.ink, fontSize: 12, fontWeight: '800' }}>내 일정 둘러보기 →</Text></Pressable>
      </View>
      <View style={m.section}>
        <View style={m.between}><View><Text style={m.sectionTitle}>같은 무대, 새로운 인연</Text><Text style={m.subtitle}>공연 가는 날, 현장에서 교환해요</Text></View><Pressable accessibilityRole="button" accessibilityLabel="현장 교환 전체 보기" onPress={() => openGoods('전체', '교환')}><Text style={m.link}>전체 보기</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {exchanges.map((item) => <View key={item.id} style={{ width: 174 }}><GoodsCard item={item} /><Text style={s.event}><Ionicons name="location-outline" size={10} /> {item.event}</Text></View>)}
        </ScrollView>
      </View>
      <View style={m.section}>
        <View style={m.between}><Text style={m.sectionTitle}>{artist}의 작은 보물들</Text><Pressable accessibilityRole="button" accessibilityLabel={`${artist} 굿즈 전체 보기`} onPress={() => openGoods(artist)}><Text style={m.link}>더 보기</Text></Pressable></View>
        <View style={m.grid}>{forArtist.map((item) => <View key={item.id} style={m.gridItem}><GoodsCard item={item} /></View>)}</View>
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
  searchIcon: { padding: 9, backgroundColor: '#FFFFFF', borderRadius: 22 },
  hero: { backgroundColor: '#EEE8FD', borderRadius: 25, padding: 23, gap: 16, overflow: 'hidden' },
  heroStamp: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#FFFFFFBF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  heroStampText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  heroTitle: { color: '#33264F', fontWeight: '900', fontSize: 28, lineHeight: 38, letterSpacing: -1.2, zIndex: 1 },
  heroCopy: { color: '#80718D', fontSize: 12, lineHeight: 20, zIndex: 1 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 },
  heroButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  heroDecor: { position: 'absolute', right: -6, top: 55, width: 140, height: 180, opacity: 0.48 },
  miniCard: { position: 'absolute', right: 13, top: 35, width: 86, height: 118, borderRadius: 9, borderWidth: 6, borderColor: '#FFFFFF', backgroundColor: '#C9B8EC', transform: [{ rotate: '14deg' }], alignItems: 'center', justifyContent: 'center' },
  miniCardText: { color: '#FFFFFF', fontWeight: '900', fontSize: 20, textAlign: 'center' },
  heroStar: { fontSize: 56, color: '#BBA3E6', position: 'absolute', top: 0, left: 0 },
  heroDot: { fontSize: 45, color: '#BBA3E6', position: 'absolute', bottom: 0, right: 0 },
  smallLabel: { fontSize: 10, color: colors.textMuted },
  artists: { gap: 18, paddingVertical: 4 },
  artistItem: { alignItems: 'center', gap: 9 },
  artistCircle: { width: 63, height: 63, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  artistSelected: { borderColor: colors.primary },
  artistInitial: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  artistHeart: { position: 'absolute', bottom: -3, right: -4, backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FAF9FC' },
  artistLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  ticket: { padding: 18, borderRadius: 22, gap: 17 },
  ticketEyebrow: { fontSize: 11, fontWeight: '800' },
  ticketTitle: { fontSize: 18, fontWeight: '900', color: '#403246' },
  ticketCopy: { color: '#66566A', fontSize: 10, lineHeight: 17 },
  dateStamp: { borderRadius: 14, padding: 12, backgroundColor: '#FFFFFF9F', alignItems: 'center', minWidth: 59 },
  dateMonth: { color: '#927887', fontSize: 9, fontWeight: '800' },
  dateDay: { color: '#624659', fontSize: 30, fontWeight: '900' },
  ticketLink: { borderTopWidth: 1, borderTopColor: '#FFFFFF80', paddingTop: 13 },
  event: { fontSize: 9, color: colors.primary, paddingTop: 8, lineHeight: 15 },
  logBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFEAF6', padding: 18, borderRadius: 20, gap: 8 },
  logTitle: { color: '#514262', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  footer: { color: '#A59BAD', fontSize: 9, textAlign: 'center' },
});
