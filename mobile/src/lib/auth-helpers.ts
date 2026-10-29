export function authApiBase(platform: string, hostname: string, apiUrl: string): string {
  return platform === 'web' && hostname !== 'localhost' && hostname !== '127.0.0.1' ? '' : apiUrl;
}

export function loginCallbackError(error: string | null): string {
  return error === 'cancelled' ? '카카오 로그인을 취소했어요.' : '카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export function parseNativeCallback(url: string): { code: string | null; error: string | null } {
  const parsed = new URL(url);
  if (parsed.protocol !== 'stagepin:' || parsed.hostname !== 'auth' || parsed.pathname !== '/callback') throw new Error('허용되지 않은 로그인 경로예요.');
  return { code: parsed.searchParams.get('code'), error: parsed.searchParams.get('error') };
}
