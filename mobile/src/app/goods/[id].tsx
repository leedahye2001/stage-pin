import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoNotice, GoodsArtwork, marketStyles as m } from '@/components/GoodsDemo';
import { goodsPrice } from '@/lib/goods-demo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';

export default function GoodsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, saved, requested, toggleSaved, request } = useGoodsDemo();
  const item = items.find((value) => value.id === id);
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState(false);
  if (!item) return <SafeAreaView style={m.safe}><View style={m.content}><Text style={m.title}>굿즈를 찾을 수 없어요</Text><Text style={m.subtitle}>삭제되었거나 존재하지 않는 샘플이에요.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/goods')}><Text style={m.link}>굿즈장터로 돌아가기</Text></Pressable></View></SafeAreaView>;
  const isExchange = item.kind === '교환';
  const isOwnPreview = item.id.startsWith('local-');
  const hasRequest = requested.includes(item.id);
  return <SafeAreaView edges={['bottom']} style={m.safe}>
    <ScrollView contentContainerStyle={[m.content, { paddingBottom: 24 }]}>
      <DemoNotice />
      <GoodsArtwork item={item} large />
      <View style={m.section}>
        <View style={m.between}><Text style={s.artist}>{item.artist} · {item.member} · {item.category}</Text><Text style={s.status}>{item.status}</Text></View>
        <Text style={s.title}>{item.title}</Text><Text style={s.price}>{goodsPrice(item)}</Text>
        <Text style={m.subtitle}>{item.methods.join(' / ')} 거래 · {item.time} · 데모 게시글</Text>
      </View>
      {isExchange ? <View style={s.wanted}><Ionicons name="swap-horizontal" size={24} color="#527F63" /><View style={{ flex: 1, gap: 6 }}><Text style={s.wantedLabel}>제가 찾고 있는 굿즈는요</Text><Text style={s.wantedTitle}>{item.wanted}</Text></View></View> : null}
      <View style={s.panel}><Text style={m.sectionTitle}>꼼꼼히 확인해 주세요</Text><View style={s.info}><Text style={m.subtitle}>굿즈 상태</Text><Text style={s.infoValue}>{item.condition}</Text></View><View style={s.info}><Text style={m.subtitle}>거래 방식</Text><Text style={s.infoValue}>{item.methods.join(' / ')}</Text></View>{!isExchange && item.methods.includes('택배') ? <View style={s.info}><Text style={m.subtitle}>배송비 예시</Text><Text style={s.infoValue}>3,000원 · 상품 가격과 별도</Text></View> : null}<Text style={s.description}>{item.description}</Text></View>
      {item.event ? <View style={s.event}><Ionicons name="location-outline" color={colors.primary} size={23} /><View style={{ flex: 1, gap: 5 }}><Text style={s.eventTitle}>이 무대에서 만나요</Text><Text style={s.eventCopy}>{item.event}</Text><Text style={m.subtitle}>가상 공연 · 만남 장소는 추후 거래 대화에서 결정</Text></View></View> : null}
      <View style={s.seller}><View style={s.avatar}><Ionicons name="person-outline" size={22} color="#8B7D9D" /></View><View><Text style={s.sellerName}>{item.seller}</Text><Text style={m.subtitle}>가상 사용자 · 실제 계정·거래 이력 없음</Text></View></View>
      <View style={s.safety}><Ionicons name="shield-checkmark-outline" size={18} color="#7D718F" /><Text style={s.safetyText}>공개 글에 연락처·주소를 남기지 마세요. 이 화면은 데모이며 상대에게 메시지를 보내거나 상품을 예약하지 않습니다.</Text></View>
    </ScrollView>
    <View style={s.bottom}>
      <Pressable accessibilityRole="button" accessibilityLabel="이 굿즈 찜" accessibilityState={{ selected: saved.includes(item.id) }} onPress={() => toggleSaved(item.id)} style={s.heart}><Ionicons name={saved.includes(item.id) ? 'heart' : 'heart-outline'} color={colors.primary} size={24} /></Pressable>
      <Pressable accessibilityRole="button" disabled={isOwnPreview || item.status === '예약 중' || hasRequest} onPress={() => { setSent(false); setPreview(true); }} style={[s.cta, (isOwnPreview || item.status === '예약 중' || hasRequest) && s.disabled]}><Text style={s.ctaText}>{isOwnPreview ? '내가 등록한 미리보기예요' : hasRequest ? '데모 신청을 남겼어요' : item.status === '예약 중' ? '예약 중인 굿즈예요' : `${isExchange ? '교환' : '구매'} 신청 미리보기`}</Text><Ionicons name="arrow-forward" color="#FFFFFF" size={17} /></Pressable>
    </View>
    <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
      <View style={s.modalBackdrop}><View accessibilityViewIsModal style={s.modal}>
        <View style={m.between}><Text style={m.sectionTitle}>{sent ? '데모 내역에 남겼어요' : `${isExchange ? '교환' : '구매'} 신청 미리보기`}</Text><Pressable accessibilityRole="button" accessibilityLabel="신청 미리보기 닫기" onPress={() => setPreview(false)} style={{ padding: 8 }}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
        <Text style={s.description}>{sent ? '상대방에게 전송되지 않았어요. MY에서 데모 신청 내역을 확인할 수 있어요.' : isExchange ? `실서비스에서는 내가 가진 '${item.wanted}'의 사진과 상태를 첨부해 제안할 수 있어요. 지금은 신청 흐름만 확인해요.` : `상품 ${goodsPrice(item)}. 실서비스에서는 거래 방식을 정한 뒤 구매를 신청해요. 지금은 결제·예약 없이 흐름만 확인해요.`}</Text>
        <Text style={s.modalNote}>메모리 보관 · 새로고침하면 초기화 · 실제 거래 아님</Text>
        <Pressable accessibilityRole="button" onPress={() => { if (sent) { setPreview(false); router.push('/my'); } else { request(item.id); setSent(true); } }} style={s.cta}><Text style={s.ctaText}>{sent ? 'MY에서 내역 보기' : '데모 신청 남기기'}</Text></Pressable>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
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
  modalBackdrop: { flex: 1, backgroundColor: '#21172D70', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 25, padding: 23, gap: 21 },
  modalNote: { color: colors.primary, fontSize: 10, lineHeight: 18 },
});
