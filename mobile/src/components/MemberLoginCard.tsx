import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getAuthConfig, getCurrentMember, logoutMember, startKakaoLogin } from '@/api/auth';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors } from '@/theme/tokens';

export function MemberLoginCard() {
  const client = useQueryClient();
  const config = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, retry: false, staleTime: 60000 });
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const feedback = useQuery({ queryKey: ['auth-feedback'], queryFn: () => null as string | null, enabled: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function action(logout = false) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (logout) { await logoutMember(); client.setQueryData(['current-member'], null); client.setQueryData(['auth-feedback'], null); }
      else if (await startKakaoLogin(Boolean(member.data))) {
        await client.invalidateQueries({ queryKey: ['current-member'] });
        client.setQueryData(['auth-feedback'], '카카오 로그인이 완료됐어요.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.'); }
    finally { setBusy(false); }
  }
  if (member.isPending || config.isPending) return <LoadingSkeleton kind="search" label="로그인 정보 불러오는 중" />;
  return <View style={s.card}>
    {member.data && feedback.data ? <View style={s.success} accessibilityLiveRegion="polite">
      <Text style={s.successText}>{feedback.data}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="로그인 완료 안내 닫기" onPress={() => client.setQueryData(['auth-feedback'], null)} hitSlop={10}><Text style={s.hint}>닫기</Text></Pressable>
    </View> : null}
    {member.data ? <>
      <View style={s.row}>
      {member.data.imageUrl ? <Image source={{ uri: member.data.imageUrl }} style={s.photo} accessibilityLabel="내 프로필 사진" /> : <View style={[s.photo, { backgroundColor: colors.surfaceMuted }]} />}
      <View style={{ flex: 1, gap: 4 }}><Text style={s.hint}>카카오로 로그인됨</Text><Text style={s.title}>{member.data.nickname}</Text></View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void action(true)} style={s.logout}><Text>{busy ? '처리 중' : '로그아웃'}</Text></Pressable>
      </View>
      <View style={s.profileField}><Text style={s.hint}>이메일</Text><Text selectable style={s.profileValue}>{member.data.email || '연동된 이메일이 없어요'}</Text></View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void action()} style={s.reconnect}><Text style={s.hint}>{busy ? '연결 중' : '카카오 프로필 다시 연동'}</Text></Pressable>
    </> : <>
      <Text style={s.title}>로그인</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="카카오 로그인" accessibilityState={{ disabled: busy || !config.data?.kakaoEnabled }} disabled={busy || !config.data?.kakaoEnabled} onPress={() => void action()} style={[s.kakao, (busy || !config.data?.kakaoEnabled) && { opacity: 0.55 }]}>
        <Image source={require('../../assets/kakao-login-official.png')} style={s.kakaoImage} resizeMode="contain" accessible={false} />
      </Pressable>
      {!config.data?.kakaoEnabled && !config.isError ? <Text style={s.hint}>카카오 로그인은 준비 중이에요.</Text> : null}
      {config.isError || member.isError ? <Pressable accessibilityRole="button" onPress={() => { void config.refetch(); void member.refetch(); }}><Text style={s.hint}>로그인 상태를 확인하지 못했어요. 다시 확인</Text></Pressable> : null}
    </>}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Text style={s.hint}>현재 찜·일정·굿즈 글은 이 기기에 저장되며, 계정 동기화는 준비 중이에요.</Text>
  </View>;
}
const s = StyleSheet.create({
  card: { gap: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { height: 44, width: 44, borderRadius: 22 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1 },
  kakao: { backgroundColor: '#FEE500', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  kakaoImage: { width: 224, height: 46 },
  logout: { marginLeft: 'auto', backgroundColor: colors.surfaceMuted, padding: 10, borderRadius: 16 },
  hint: { fontSize: 12, lineHeight: 19, color: colors.textMuted },
  error: { fontSize: 13, lineHeight: 20, color: '#B42318' },
  profileField: { gap: 4 },
  profileValue: { color: colors.text, fontSize: 14, lineHeight: 21 },
  reconnect: { alignSelf: 'flex-start', paddingVertical: 6 },
  success: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12 },
  successText: { flex: 1, color: colors.primary, fontSize: 14, fontWeight: '600' },
});
