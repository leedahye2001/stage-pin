import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getAuthConfig, getCurrentMember, logoutMember, startKakaoLogin } from '@/api/auth';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors, radius, spacing } from '@/theme/tokens';

export function MemberLoginCard({ guestMessage }: { guestMessage?: string }) {
  const client = useQueryClient();
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const config = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, enabled: member.data === null, retry: false, staleTime: 60000 });
  const feedback = useQuery({ queryKey: ['auth-feedback'], queryFn: () => null as string | null, enabled: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function action(logout = false) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (logout) {
        await logoutMember();
        await client.cancelQueries({ queryKey: ['my-goods'] });
        client.removeQueries({ queryKey: ['my-goods'] });
        client.setQueryData(['current-member'], null);
        client.setQueryData(['auth-feedback'], null);
      } else if (await startKakaoLogin()) {
        await client.invalidateQueries({ queryKey: ['current-member'] });
        client.setQueryData(['auth-feedback'], '카카오 로그인이 완료됐어요.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.'); }
    finally { setBusy(false); }
  }
  if (member.isPending || (member.data === null && config.isPending)) return <LoadingSkeleton kind="account" label="로그인 정보 불러오는 중" />;
  if (member.isError && !member.data) return <View style={s.login}>
    <Text accessibilityRole="alert" style={s.hint}>로그인 정보를 불러오지 못했어요.</Text>
    <Pressable accessibilityRole="button" onPress={() => void member.refetch()} style={s.button}><Text style={s.buttonText}>다시 시도</Text></Pressable>
  </View>;
  return <View style={member.data ? s.profile : s.login}>
    {member.data && feedback.data ? <View style={s.success} accessibilityLiveRegion="polite">
      <Text style={s.successText}>{feedback.data}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="로그인 완료 안내 닫기" onPress={() => client.setQueryData(['auth-feedback'], null)} hitSlop={10}><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable>
    </View> : null}
    {member.data ? <View style={s.row}>
      {member.data.imageUrl ? <Image source={{ uri: member.data.imageUrl }} style={s.photo} accessibilityLabel="내 프로필 사진" /> : <View style={[s.photo, s.placeholder]}><Ionicons name="person-outline" size={26} color={colors.textMuted} /></View>}
      <View style={s.identity}><Text numberOfLines={1} style={s.title}>{member.data.nickname}</Text>{member.data.email ? <Text numberOfLines={1} selectable style={s.hint}>{member.data.email}</Text> : null}</View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void action(true)} style={s.button}><Text style={s.buttonText}>{busy ? '처리 중' : '로그아웃'}</Text></Pressable>
    </View> : <>
      <Text style={s.title}>로그인</Text>
      {guestMessage ? <Text style={s.hint}>{guestMessage}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="카카오 로그인" accessibilityState={{ disabled: busy || !config.data?.kakaoEnabled }} disabled={busy || !config.data?.kakaoEnabled} onPress={() => void action()} style={[s.kakao, (busy || !config.data?.kakaoEnabled) && s.disabled]}>
        <Image source={require('../../assets/kakao-login-official.png')} style={s.kakaoImage} resizeMode="contain" accessible={false} />
      </Pressable>
      {!config.data?.kakaoEnabled && !config.isError ? <Text style={s.hint}>카카오 로그인은 준비 중이에요.</Text> : null}
      {config.isError ? <Pressable accessibilityRole="button" onPress={() => void config.refetch()}><Text accessibilityRole="alert" style={s.hint}>로그인 설정을 불러오지 못했어요. 다시 시도</Text></Pressable> : null}
    </>}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}
const s = StyleSheet.create({
  profile: { gap: spacing.md, paddingVertical: spacing.sm },
  login: { gap: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 72 },
  photo: { height: 56, width: 56, borderRadius: 28 },
  placeholder: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, minWidth: 0, gap: spacing.xs },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  button: { backgroundColor: colors.button, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.pill },
  buttonText: { color: colors.buttonText, fontSize: 12, fontWeight: '700' },
  kakao: { backgroundColor: '#FEE500', borderRadius: radius.sm, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  kakaoImage: { width: 224, height: 46 },
  disabled: { opacity: 0.55 },
  hint: { fontSize: 12, lineHeight: 20, color: colors.textMuted },
  error: { fontSize: 13, lineHeight: 20, color: '#B42318' },
  success: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: 12 },
  successText: { flex: 1, color: colors.primary, fontSize: 13, fontWeight: '600' },
});
