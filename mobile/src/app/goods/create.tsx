import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { marketStyles as m } from '@/components/GoodsDemo';
import { createDemoListing, digitsOnly, goodsConditions, MAX_GOODS_PHOTOS, validateGoodsPhotos, type GoodsDraft } from '@/lib/goods-demo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { colors } from '@/theme/tokens';

export default function GoodsCreateScreen() {
  const { addListing } = useGoodsDemo();
  const [draft, setDraft] = useState<GoodsDraft>({ artist: '', title: '', kind: '판매', price: '', wanted: '', condition: '', photos: [], description: '', onsite: false, delivery: true, event: '' });
  const [error, setError] = useState('');
  const [conditionOpen, setConditionOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const field = (key: 'artist' | 'title' | 'price' | 'wanted' | 'event' | 'description', label: string, placeholder: string) => <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={draft[key]} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: key === 'price' ? digitsOnly(value) : value }))} placeholder={placeholder} placeholderTextColor="#A398B0" keyboardType={key === 'price' ? 'number-pad' : 'default'} inputMode={key === 'price' ? 'numeric' : undefined} multiline={key === 'description'} maxLength={key === 'description' ? 1000 : key === 'title' ? 80 : 100} style={[s.input, key === 'description' && s.multiline]} /></View>;
  const pickPhotos = async () => {
    setPicking(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_GOODS_PHOTOS - draft.photos.length, quality: 0.85 });
      if (result.canceled) return;
      const photos = result.assets.map(({ uri, width, height, fileSize, mimeType }) => ({ uri, width, height, fileSize, mimeType }));
      validateGoodsPhotos([...draft.photos, ...photos]);
      setDraft((current) => ({ ...current, photos: [...current.photos, ...photos] }));
    } catch (exception) { setError(exception instanceof Error ? exception.message : '사진을 불러오지 못했어요. 다시 선택해 주세요.'); }
    finally { setPicking(false); }
  };
  const submit = () => {
    try {
      const item = createDemoListing(draft, `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      addListing(item);
      router.replace({ pathname: '/goods/[id]', params: { id: item.id } });
    } catch (exception) { setError(exception instanceof Error ? exception.message : '입력 내용을 확인해 주세요.'); }
  };
  return <SafeAreaView edges={['bottom']} style={m.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={m.content}>
    <View style={{ gap: 8 }}><Text style={m.title}>다음 주인을 찾아요</Text><Text style={m.subtitle}>판매할 굿즈도, 교환하고 싶은 마음도.</Text></View>
    <View style={s.notice}><Text style={s.noticeTitle}>등록 흐름 미리보기</Text><Text style={m.subtitle}>글과 첨부 사진은 이 앱 안에만 추가되며 새로고침하면 사라져요. 서버 업로드·실제 게시·결제·상대방 전송은 하지 않아요.</Text></View>
    <View style={m.row}>{(['판매', '교환'] as const).map((kind) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`${kind} 글 작성`} accessibilityState={{ selected: draft.kind === kind }} onPress={() => setDraft({ ...draft, kind })} style={[m.chip, draft.kind === kind && m.chipSelected]}><Text style={[m.chipText, draft.kind === kind && m.chipSelectedText]}>{kind}</Text></Pressable>)}</View>
    {field('artist', '아티스트', '예: DAY6, 데이식스')}
    {field('title', '글 제목', '어떤 굿즈인가요?')}
    {draft.kind === '판매' ? field('price', '판매 가격', '원 단위로 입력') : field('wanted', '구하는 굿즈', '교환하고 싶은 멤버·굿즈를 알려 주세요')}
    <View style={s.field}><Text style={s.label}>굿즈 상태 · 필수</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="굿즈 상태 선택" accessibilityState={{ expanded: conditionOpen }} onPress={() => setConditionOpen(!conditionOpen)} style={[s.input, m.between]}><Text style={{ color: draft.condition ? colors.text : colors.textMuted }}>{goodsConditions.find((entry) => entry.code === draft.condition)?.label ?? '상태를 선택해 주세요'}</Text><Text>{conditionOpen ? '⌃' : '⌄'}</Text></Pressable>
      {conditionOpen ? <View style={s.options}>{goodsConditions.map(({ code, label }) => <Pressable key={code} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: draft.condition === code }} onPress={() => { setDraft({ ...draft, condition: code }); setConditionOpen(false); }} style={s.option}><Text style={{ color: draft.condition === code ? colors.primary : colors.text }}>{label}</Text><Text style={{ color: colors.primary }}>{draft.condition === code ? '✓' : ''}</Text></Pressable>)}</View> : null}
    </View>
    <View style={s.field}><View style={m.between}><Text style={s.label}>상태 확인 사진 · 필수</Text><Text style={m.subtitle}>{draft.photos.length}/{MAX_GOODS_PHOTOS}</Text></View><Text style={m.subtitle}>실물과 하자가 보이게 찍어 주세요. 최소 1장, 최대 5장 · 장당 10MB 이하{ '\n' }첫 번째 사진이 대표 사진이에요. 개인정보가 담긴 사진은 피해주세요.</Text>
      <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
        {draft.photos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={s.photo}><Image accessibilityLabel={`첨부 사진 ${index + 1}`} source={{ uri: photo.uri }} style={s.photoImage} /><Pressable accessibilityRole="button" accessibilityLabel={`사진 ${index + 1} 삭제`} onPress={() => setDraft((current) => ({ ...current, photos: current.photos.filter((_, entry) => entry !== index) }))} style={s.remove}><Text style={{ color: '#FFFFFF' }}>×</Text></Pressable>{index === 0 ? <Text style={s.cover}>대표</Text> : null}</View>)}
        {draft.photos.length < MAX_GOODS_PHOTOS ? <Pressable accessibilityRole="button" accessibilityLabel="굿즈 사진 첨부" disabled={picking} onPress={pickPhotos} style={s.addPhoto}><Text style={{ fontSize: 25, color: colors.primary }}>＋</Text><Text style={m.link}>{picking ? '불러오는 중…' : '사진 첨부'}</Text></Pressable> : null}
      </ScrollView>
    </View>
    <View style={s.field}><Text style={s.label}>거래 방식</Text><View style={m.row}>{([{ key: 'delivery', label: '택배 거래' }, { key: 'onsite', label: '공연 현장 거래' }] as const).map(({ key, label }) => <Pressable key={key} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: draft[key] }} onPress={() => setDraft({ ...draft, [key]: !draft[key] })} style={[m.chip, draft[key] && m.chipSelected]}><Text style={[m.chipText, draft[key] && m.chipSelectedText]}>{label}</Text></Pressable>)}</View></View>
    {draft.onsite ? field('event', '현장 거래할 공연', '공연명·날짜·공연장 (정확한 만남 위치 제외)') : null}
    {field('description', '상세 설명', '구성품과 거래 조건을 적어 주세요. 연락처·주소는 공개하지 마세요.')}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={picking} onPress={submit} style={s.submit}><Text style={s.submitText}>앱에 미리보기 등록</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  options: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6E0EE', overflow: 'hidden' },
  option: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  photo: { width: 100, height: 110, position: 'relative' }, photoImage: { width: '100%', height: '100%', borderRadius: 12 },
  addPhoto: { width: 100, height: 110, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9B9E5', justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: '#F2EDF9' },
  remove: { position: 'absolute', right: 0, top: 0, width: 44, height: 44, borderRadius: 12, backgroundColor: '#30273DC9', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', bottom: 5, left: 5, color: '#FFFFFF', backgroundColor: colors.primary, fontSize: 10, padding: 4, borderRadius: 5 },
  field: { gap: 10 }, label: { fontSize: 13, color: colors.text, fontWeight: '800' },
  input: { padding: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E0EE', borderRadius: 14, fontSize: 14, color: colors.text },
  multiline: { minHeight: 110, textAlignVertical: 'top' }, notice: { padding: 16, borderRadius: 17, backgroundColor: '#F0ECF7', gap: 7 },
  noticeTitle: { fontSize: 12, fontWeight: '800', color: colors.primary }, error: { color: '#AE4958', fontSize: 13 },
  submit: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, alignItems: 'center' }, submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
