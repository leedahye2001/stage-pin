import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { marketStyles as m } from '@/components/GoodsDemo';
import { createDemoListing, type GoodsDraft } from '@/lib/goods-demo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';

export default function GoodsCreateScreen() {
  const { addListing } = useGoodsDemo();
  const [draft, setDraft] = useState<GoodsDraft>({ artist: '', title: '', kind: '판매', price: '', wanted: '', condition: '', description: '', onsite: false, delivery: true, event: '' });
  const [error, setError] = useState('');
  const field = (key: 'artist' | 'title' | 'price' | 'wanted' | 'condition' | 'event' | 'description', label: string, placeholder: string) => <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={draft[key]} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))} placeholder={placeholder} placeholderTextColor="#A398B0" keyboardType={key === 'price' ? 'number-pad' : 'default'} multiline={key === 'description'} maxLength={key === 'description' ? 1000 : key === 'title' ? 80 : 100} style={[s.input, key === 'description' && s.multiline]} /></View>;
  const submit = () => {
    try {
      const item = createDemoListing(draft, `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      addListing(item);
      router.replace({ pathname: '/goods/[id]', params: { id: item.id } });
    } catch (exception) { setError(exception instanceof Error ? exception.message : '입력 내용을 확인해 주세요.'); }
  };
  return <SafeAreaView edges={['bottom']} style={m.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={m.content}>
    <View style={{ gap: 8 }}><Text style={m.title}>다음 주인을 찾아요</Text><Text style={m.subtitle}>판매할 굿즈도, 교환하고 싶은 마음도.</Text></View>
    <View style={s.notice}><Text style={s.noticeTitle}>등록 흐름 미리보기</Text><Text style={m.subtitle}>이 앱 안에만 추가되며 새로고침하면 사라져요. 실제 게시·결제·상대방 전송은 하지 않아요. 사진은 샘플 일러스트로 표시해요.</Text></View>
    <View style={m.row}>{(['판매', '교환'] as const).map((kind) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`${kind} 글 작성`} accessibilityState={{ selected: draft.kind === kind }} onPress={() => setDraft({ ...draft, kind })} style={[m.chip, draft.kind === kind && m.chipSelected]}><Text style={[m.chipText, draft.kind === kind && m.chipSelectedText]}>{kind}</Text></Pressable>)}</View>
    {field('artist', '아티스트', '예: DAY6, 데이식스')}
    {field('title', '글 제목', '어떤 굿즈인가요?')}
    {draft.kind === '판매' ? field('price', '판매 가격', '원 단위로 입력') : field('wanted', '구하는 굿즈', '교환하고 싶은 멤버·굿즈를 알려 주세요')}
    {field('condition', '굿즈 상태', '개봉 여부와 하자를 솔직하게 적어 주세요')}
    <View style={s.field}><Text style={s.label}>거래 방식</Text><View style={m.row}>{([{ key: 'delivery', label: '택배 거래' }, { key: 'onsite', label: '공연 현장 거래' }] as const).map(({ key, label }) => <Pressable key={key} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: draft[key] }} onPress={() => setDraft({ ...draft, [key]: !draft[key] })} style={[m.chip, draft[key] && m.chipSelected]}><Text style={[m.chipText, draft[key] && m.chipSelectedText]}>{label}</Text></Pressable>)}</View></View>
    {draft.onsite ? field('event', '현장 거래할 공연', '공연명·날짜·공연장 (정확한 만남 위치 제외)') : null}
    {field('description', '상세 설명', '구성품과 거래 조건을 적어 주세요. 연락처·주소는 공개하지 마세요.')}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" onPress={submit} style={s.submit}><Text style={s.submitText}>앱에 미리보기 등록</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  field: { gap: 10 }, label: { fontSize: 13, color: colors.text, fontWeight: '800' },
  input: { padding: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E0EE', borderRadius: 14, fontSize: 14, color: colors.text },
  multiline: { minHeight: 110, textAlignVertical: 'top' }, notice: { padding: 16, borderRadius: 17, backgroundColor: '#F0ECF7', gap: 7 },
  noticeTitle: { fontSize: 12, fontWeight: '800', color: colors.primary }, error: { color: '#AE4958', fontSize: 13 },
  submit: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, alignItems: 'center' }, submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
