import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { noticeRequest, type NoticeExtraction, type TicketNotice } from '@/api/concerts';
import { colors, radius, spacing } from '@/theme/tokens';

const fields: [keyof NoticeExtraction, string][] = [
  ['artistName', '아티스트'], ['concertTitle', '공연명'], ['venue', '공연장'],
  ['performancePeriod', '공연 기간'], ['fanVerificationPeriod', '팬클럽 인증 기간'],
  ['presaleAt', '선예매 시작일'], ['generalSaleAt', '일반예매 시작일'],
  ['vendor', '예매처'], ['ticketUrl', '예매 링크'],
];
const vendors = ['NOL', 'YES24', 'MELON', 'TICKETLINK', 'OTHER'];

export default function NoticeReviewScreen() {
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  const [text, setText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notices, setNotices] = useState<TicketNotice[]>([]);
  const [notice, setNotice] = useState<TicketNotice | null>(null);
  const [reviewed, setReviewed] = useState<NoticeExtraction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const select = (item: TicketNotice) => {
    setNotice(item);
    setReviewed(item.reviewed ?? item.extracted);
    setConfirmed(false);
    setMessage('');
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '요청에 실패했어요.'); }
    finally { setBusy(false); }
  };
  const analyze = () => run(async () => {
    const draft = await noticeRequest<TicketNotice>(key, '', { sourceUrl, text });
    select(draft);
    setNotices((current) => [draft, ...current]);
  });
  const approve = () => run(async () => {
    if (!notice || !reviewed || !confirmed) return;
    const approved = await noticeRequest<TicketNotice>(key, `/${notice.id}/approve`, reviewed);
    select(approved);
    setNotices((current) => current.map((item) => item.id === approved.id ? approved : item));
    await queryClient.invalidateQueries({ queryKey: ['ticket-openings'] });
    setMessage('승인 완료! 앞으로 열리는 예매 일정이 홈에 표시돼요.');
  });
  const update = (name: keyof NoticeExtraction, part: 'value' | 'evidence', value: string) => {
    setReviewed((current) => current ? { ...current, [name]: { ...current[name], [part]: value } } : current);
    setConfirmed(false);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>NOTICE → SCHEDULE</Text>
          <Text style={styles.title}>공지를 일정으로 핀하세요.</Text>
          <Text style={styles.description}>공식 공지문을 붙여넣으면 로컬 AI가 예매 일정을 정리해요. 원문과 대조하고 승인한 정보만 공개됩니다.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>관리자 키</Text>
          <TextInput accessibilityLabel="관리자 키" secureTextEntry autoCapitalize="none" autoCorrect={false}
            style={styles.input} value={key} onChangeText={(value) => { setKey(value); setNotice(null); setReviewed(null); setNotices([]); }}
            placeholder="관리자 키 입력" placeholderTextColor={colors.textMuted} />
          <Text style={styles.hint}>키는 이 화면에 머무는 동안만 사용하며 기기에 저장하지 않아요.</Text>
          <Pressable disabled={busy || !key.trim()} style={styles.secondary} onPress={() => run(async () => {
            setNotices(await noticeRequest<TicketNotice[]>(key));
          })}><Text style={styles.secondaryLabel}>최근 분석 불러오기</Text></Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. 공식 공지 입력</Text>
          <Text style={styles.label}>출처 링크</Text>
          <TextInput accessibilityLabel="공식 공지 출처" autoCapitalize="none" autoCorrect={false} value={sourceUrl}
            onChangeText={setSourceUrl} style={styles.input} placeholder="https://공식-공지-주소" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>공지 원문</Text>
          <TextInput accessibilityLabel="공지 원문" multiline maxLength={16000} style={[styles.input, styles.sourceInput]}
            value={text} onChangeText={setText} placeholder="공연명, 공연 기간, 선예매·일반예매 안내가 담긴 공지문을 붙여넣으세요."
            placeholderTextColor={colors.textMuted} />
          <Text style={styles.hint}>공지문은 연결된 로컬 AI 서버에서 분석하며 외부 유료 AI로 전송하지 않아요. 첫 분석은 모델 로딩으로 시간이 걸릴 수 있어요.</Text>
          <Pressable disabled={busy || !key.trim() || text.trim().length < 20 || !sourceUrl.startsWith('https://')}
            onPress={analyze} style={[styles.primary, (busy || !key.trim() || text.trim().length < 20 || !sourceUrl.startsWith('https://')) && styles.disabled]}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryLabel}>AI로 일정 정리하기</Text>}
          </Pressable>
        </View>
        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        {notice && reviewed ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. 원문과 대조하고 수정</Text>
            <Text style={styles.hint}>{notice.status === 'APPROVED' ? '승인 완료' : '검수 대기'} · {(notice.latencyMs / 1000).toFixed(1)}초 · {notice.totalTokens} 토큰</Text>
            <Text accessibilityRole="link" style={styles.link} onPress={() => Linking.openURL(notice.sourceUrl)}>공식 공지 원문 열기 ↗</Text>
            <Text selectable style={styles.source}>{notice.sourceText}</Text>
            {fields.map(([name, label]) => (
              <View key={name} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                {name === 'vendor' ? (
                  <View style={styles.vendorRow}>{vendors.map((vendor) => (
                    <Pressable key={vendor} disabled={notice.status === 'APPROVED' || busy} onPress={() => update(name, 'value', vendor)}
                      style={[styles.vendor, reviewed.vendor.value === vendor && styles.vendorSelected]}>
                      <Text style={styles.secondaryLabel}>{vendor}</Text>
                    </Pressable>
                  ))}</View>
                ) : (
                  <TextInput accessibilityLabel={label} editable={notice.status !== 'APPROVED' && !busy}
                    style={styles.input} value={reviewed[name].value} onChangeText={(value) => update(name, 'value', value)}
                    placeholder={name.endsWith('At') ? '2026-11-02T20:00:00+09:00' : '원문에 없으면 비워 두세요'}
                    placeholderTextColor={colors.textMuted} autoCapitalize="none" />
                )}
                <Text style={styles.evidenceLabel}>원문 근거 {notice.sourceText.includes(reviewed[name].evidence) && reviewed[name].evidence ? '· 인용 확인' : '· 확인 필요'}</Text>
                <TextInput accessibilityLabel={`${label} 원문 근거`} multiline editable={notice.status !== 'APPROVED' && !busy}
                  style={[styles.input, styles.evidence]} value={reviewed[name].evidence} onChangeText={(value) => update(name, 'evidence', value)}
                  placeholder="공지문에서 근거 문구를 그대로 인용하세요" placeholderTextColor={colors.textMuted} />
              </View>
            ))}
            {notice.status !== 'APPROVED' ? (
              <>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} disabled={busy}
                  style={styles.confirm} onPress={() => setConfirmed(!confirmed)}>
                  <Text style={styles.secondaryLabel}>{confirmed ? '☑' : '☐'} 원문과 예매 일시·예매처·링크를 확인했습니다.</Text>
                </Pressable>
                <Pressable disabled={busy || !confirmed} onPress={approve} style={[styles.primary, (busy || !confirmed) && styles.disabled]}>
                  <Text style={styles.primaryLabel}>3. 승인하고 일정 공개</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
        {notices.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>최근 분석</Text>
            {notices.map((item) => <Pressable key={item.id} onPress={() => select(item)} style={styles.history}>
              <Text style={styles.label}>{(item.reviewed ?? item.extracted).concertTitle.value || '제목 확인 필요'}</Text>
              <Text style={styles.hint}>{item.status === 'APPROVED' ? '승인 완료' : '검수 대기'} · {new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
            </Pressable>)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  hero: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.lg },
  eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  description: { color: colors.textMuted, lineHeight: 21 },
  card: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '800', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: radius.md, color: colors.text, fontSize: 14, minHeight: 44 },
  sourceInput: { minHeight: 170, textAlignVertical: 'top' },
  hint: { fontSize: 11, lineHeight: 17, color: colors.textMuted },
  primary: { backgroundColor: colors.primary, minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: 12 },
  primaryLabel: { color: colors.white, fontWeight: '800' },
  secondary: { backgroundColor: colors.primarySoft, padding: 12, borderRadius: radius.md, alignItems: 'center' },
  secondaryLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  message: { color: colors.primary, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md, lineHeight: 21 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  source: { color: colors.textMuted, backgroundColor: colors.background, padding: 12, borderRadius: radius.md, fontSize: 12, lineHeight: 19 },
  field: { gap: 6, marginTop: spacing.md },
  evidenceLabel: { color: colors.textMuted, fontSize: 10 },
  evidence: { backgroundColor: colors.background, fontSize: 12, minHeight: 56 },
  vendorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vendor: { padding: 9, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  vendorSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  confirm: { paddingVertical: 16 },
  history: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
});
