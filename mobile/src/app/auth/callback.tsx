import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { completeKakaoLogin } from '@/api/auth';
import { loginCallbackError } from '@/lib/auth-helpers';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors } from '@/theme/tokens';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>();
  const client = useQueryClient();
  const [failure, setFailure] = useState('');
  useEffect(() => {
    const code = typeof params.code === 'string' ? params.code : '';
    const error = typeof params.error === 'string' ? params.error : null;
    // Remove the single-use code from browser history before loading anything else.
    if (Platform.OS === 'web') window.history.replaceState(null, '', '/auth/callback');
    const task = error || !code ? Promise.reject(new Error(loginCallbackError(error))) : completeKakaoLogin(code);
    let active = true;
    task.then(async () => {
      await client.invalidateQueries({ queryKey: ['current-member'] });
      client.setQueryData(['auth-feedback'], '카카오 로그인이 완료됐어요.');
      if (active) router.replace('/my');
    }).catch(cause => { if (active) setFailure(cause instanceof Error ? cause.message : '로그인에 실패했어요.'); });
    return () => { active = false; };
  }, [params.code, params.error, client]);
  return <View style={s.page}>{failure ? <>
    <Text style={s.message}>{failure}</Text>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/my')} style={s.button}><Text>MY로 돌아가기</Text></Pressable>
  </> : <LoadingSkeleton kind="search" label="로그인 완료하는 중" />}</View>;
}
const s = StyleSheet.create({ page: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.background, gap: 18 }, message: { color: colors.text, fontSize: 15, lineHeight: 24 }, button: { backgroundColor: colors.surfaceMuted, padding: 16, borderRadius: 24, alignItems: 'center' } });
