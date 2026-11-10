import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodsArtwork, marketStyles as m } from '@/components/GoodsDemo';
import { goodsPrice } from '@/lib/goods-demo';
import { useGoods } from '@/lib/goods-state';
import { getGoodsDetail, goodsBase } from '@/api/goods';
import { getCurrentMember } from '@/api/auth';
import { goodsItem } from '@/lib/goods-listings';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout, responsiveStyles } from '@/lib/use-responsive-layout';

export default function GoodsDetailScreen() {
  const { isWide, isDesktop } = useResponsiveLayout();
  const { id, registered } = useLocalSearchParams<{ id: string; registered?: string }>();
  const { saved, toggleSaved } = useGoods();
  const query = useQuery({ queryKey: ['goods-detail', id], queryFn: () => getGoodsDetail(id), retry: false });
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  if (query.isPending) return <SafeAreaView style={m.safe}><LoadingSkeleton kind="detail" label="굿즈 상세 불러오는 중" /></SafeAreaView>;
  if (!query.data || query.isError) return <SafeAreaView style={m.safe}><View style={m.content}><Text style={m.title}>굿즈를 불러오지 못했어요</Text><Text style={m.subtitle}>{query.error?.message || '삭제되었거나 존재하지 않는 글이에요.'}</Text><Pressable accessibilityRole="button" onPress={() => void query.refetch()}><Text style={m.link}>다시 시도</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.replace('/goods')}><Text style={m.link}>굿즈로 돌아가기</Text></Pressable></View></SafeAreaView>;
  const item = goodsItem(query.data, goodsBase());
  const isExchange = item.kind === '교환';
  const isOwn = member.data?.id === item.ownerId;
  const actions = <View style={[s.bottom, isDesktop && s.desktopActions]}>
    <Pressable accessibilityRole="button" accessibilityLabel="이 굿즈 찜" accessibilityState={{ selected: saved.includes(item.id) }} onPress={() => toggleSaved(item.id)} style={s.heart}><Ionicons name={saved.includes(item.id) ? 'heart' : 'heart-outline'} color={colors.primary} size={24} /></Pressable>
    <View style={[s.cta, s.disabled]}><Text style={[s.ctaText, isDesktop && { fontSize: 15 }]}>{isOwn ? '내가 등록한 글이에요' : '거래 신청 준비 중'}</Text></View>
  </View>;
  return <SafeAreaView edges={['top', 'bottom']} style={m.safe}>
    <ScrollView contentContainerStyle={[m.content, isWide && responsiveStyles.content, { paddingBottom: 24 }]}>
      {registered === '1' && isOwn ? <View style={s.panel}><Text accessibilityLiveRegion="polite" style={m.sectionTitle}>등록이 완료됐어요</Text><Text style={m.subtitle}>사진과 글이 저장됐어요. MY의 내 등록 굿즈에서도 볼 수 있어요.</Text><Pressable accessibilityRole="button" onPress={() => router.setParams({ registered: '' })}><Text style={m.link}>닫기</Text></Pressable></View> : null}
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 40 : 24 }}>
      <View style={isDesktop ? { flex: 1 } : undefined}><GoodsArtwork item={item} large /></View>
      <View style={[{ gap: 24 }, isDesktop && { flex: 1, minWidth: 0 }]}>
      <View style={m.section}>
        <View style={m.between}><Text style={[s.artist, isDesktop && s.desktopMeta]}>{[item.artist, item.member, item.category].filter(Boolean).join(' / ')}</Text><Text style={[s.status, isDesktop && { fontSize: 13 }]}>{item.status}</Text></View>
        <Text style={[s.title, isDesktop && s.desktopTitle]}>{item.title}</Text><Text style={[s.price, isDesktop && s.desktopPrice]}>{goodsPrice(item)}</Text>
        <Text style={[m.subtitle, isDesktop && s.desktopMeta]}>{item.methods.join(' / ')} 거래, {item.time}</Text>
      </View>
      {isExchange ? <View style={s.wanted}><Ionicons name="swap-horizontal" size={24} color="#527F63" /><View style={{ flex: 1, gap: 6 }}><Text style={s.wantedLabel}>제가 찾고 있는 굿즈는요</Text><Text style={s.wantedTitle}>{item.wanted}</Text></View></View> : null}
      <View style={[s.panel, isDesktop && s.desktopPanel]}><Text style={m.sectionTitle}>굿즈 정보</Text><View style={s.info}><Text style={[m.subtitle, isDesktop && s.desktopMeta]}>굿즈 상태</Text><Text style={[s.infoValue, isDesktop && s.desktopMeta]}>{item.condition}</Text></View><View style={s.info}><Text style={[m.subtitle, isDesktop && s.desktopMeta]}>거래 방식</Text><Text style={[s.infoValue, isDesktop && s.desktopMeta]}>{item.methods.join(' / ')}</Text></View><Text style={[s.description, isDesktop && s.desktopBody]}>{item.description}</Text></View>
      {item.event ? <View style={s.event}><Ionicons name="location-outline" color={colors.primary} size={23} /><View style={{ flex: 1, gap: 5 }}><Text style={s.eventTitle}>현장 거래 희망 공연</Text><Text style={s.eventCopy}>{item.event}</Text></View></View> : null}
      <View style={s.seller}><View style={s.avatar}><Ionicons name="person-outline" size={22} color="#8B7D9D" /></View><View><Text style={s.sellerName}>{item.seller}{isOwn ? ' (내 글)' : ''}</Text><Text style={m.subtitle}>등록자</Text></View></View>
      <View style={s.safety}><Ionicons name="shield-checkmark-outline" size={18} color="#7D718F" /><Text style={[s.safetyText, isDesktop && { fontSize: 13, lineHeight: 22 }]}>공개 글에 연락처와 주소를 남기지 마세요. 결제, 채팅, 거래 신청은 아직 연결되지 않았어요.</Text></View>
      {isDesktop ? actions : null}
      </View></View>
    </ScrollView>
    {!isDesktop ? actions : null}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  desktopTitle: { fontSize: 30, lineHeight: 42 },
  desktopPrice: { fontSize: 32, lineHeight: 42 },
  desktopMeta: { fontSize: 15, lineHeight: 24 },
  desktopBody: { fontSize: 16, lineHeight: 28 },
  desktopPanel: { paddingHorizontal: 0, borderTopWidth: 1, borderTopColor: colors.border, borderRadius: 0 },
  desktopActions: { borderTopWidth: 0, padding: 0 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, lineHeight: 34, letterSpacing: -0.6 },
  artist: { fontSize: 11, color: colors.primary, fontWeight: '700', flex: 1 },
  status: { fontSize: 10, color: '#6D8372', backgroundColor: '#EAF1E8', borderRadius: 8, padding: 7 },
  price: { fontSize: 27, fontWeight: '900', color: colors.text },
  wanted: { padding: 20, borderRadius: 20, backgroundColor: '#E8F2E9', flexDirection: 'row', gap: 15, alignItems: 'center' },
  wantedLabel: { fontSize: 11, color: '#7B947F' },
  wantedTitle: { fontSize: 15, fontWeight: '800', color: '#487459' },
  panel: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 21, gap: 18 },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  infoValue: { fontSize: 12, color: '#51485B', flex: 1, textAlign: 'right', lineHeight: 20 },
  description: { fontSize: 13, lineHeight: 23, color: '#716779' },
  event: { backgroundColor: '#EEE8FA', padding: 19, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventTitle: { fontSize: 14, fontWeight: '800', color: '#5F4C82' },
  eventCopy: { fontSize: 12, color: colors.primary },
  seller: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 18, backgroundColor: '#EEE9F3', alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontSize: 14, fontWeight: '800', color: colors.text },
  safety: { flexDirection: 'row', gap: 9, paddingVertical: 12 },
  safetyText: { flex: 1, fontSize: 10, lineHeight: 19, color: '#908597' },
  bottom: { borderTopWidth: 1, borderTopColor: '#E8E3EF', backgroundColor: '#FFFFFF', padding: 16, flexDirection: 'row', gap: 12, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  heart: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6E0F0', borderRadius: 15 },
  cta: { backgroundColor: colors.primary, borderRadius: 15, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexGrow: 1 },
  ctaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
