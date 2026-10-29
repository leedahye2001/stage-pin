import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { API_URL } from '@/api/concerts';
import { authApiBase, loginCallbackError, parseNativeCallback } from '@/lib/auth-helpers';

export type Member = { id: string; nickname: string; imageUrl: string | null; email: string | null };
const VERIFIER_KEY = 'stagepin.login.verifier';
const TOKEN_KEY = 'stagepin.auth.token';
const nativeRedirect = 'stagepin://auth/callback';

function base() { return authApiBase(Platform.OS, Platform.OS === 'web' ? window.location.hostname : '', API_URL!); }
async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const token = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(TOKEN_KEY);
  const response = await fetch(`${base()}/api/v1/auth${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'include',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 401) {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(TOKEN_KEY);
    throw new AuthRequiredError();
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || '로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
class AuthRequiredError extends Error { }
export function getAuthConfig() { return authRequest<{ kakaoEnabled: boolean }>('/config'); }
export async function getCurrentMember(): Promise<Member | null> {
  try { return await authRequest<Member>('/me'); }
  catch (error) { if (error instanceof AuthRequiredError) return null; throw error; }
}
async function saveVerifier(value: string) {
  if (Platform.OS === 'web') sessionStorage.setItem(VERIFIER_KEY, value);
  else await SecureStore.setItemAsync(VERIFIER_KEY, value);
}
async function readVerifier() { return Platform.OS === 'web' ? sessionStorage.getItem(VERIFIER_KEY) : SecureStore.getItemAsync(VERIFIER_KEY); }
async function clearVerifier() {
  if (Platform.OS === 'web') sessionStorage.removeItem(VERIFIER_KEY);
  else await SecureStore.deleteItemAsync(VERIFIER_KEY);
}
export async function startKakaoLogin(profileConsent = false): Promise<boolean> {
  const random = await Crypto.getRandomBytesAsync(32);
  const verifier = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const challenge = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await saveVerifier(verifier);
  try {
    const { authorizationUrl } = await authRequest<{ authorizationUrl: string }>('/kakao/start', { client: Platform.OS === 'web' ? 'WEB' : 'NATIVE', challenge, profileConsent });
    if (Platform.OS === 'web') { window.location.assign(authorizationUrl); return false; }
    const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, nativeRedirect);
    if (result.type !== 'success') { await clearVerifier(); return false; }
    const callback = parseNativeCallback(result.url);
    if (callback.error || !callback.code) throw new Error(loginCallbackError(callback.error));
    await completeKakaoLogin(callback.code);
    return true;
  } catch (error) { await clearVerifier(); throw error; }
}

// Native browser completion and the deep-link route can fire together. Exchange only once.
let completion: { code: string; promise: Promise<void> } | null = null;
export function completeKakaoLogin(code: string): Promise<void> {
  if (completion?.code === code) return completion.promise;
  const promise = (async () => {
    const verifier = await readVerifier();
    if (!verifier || !/^[A-Za-z0-9_-]{43}$/.test(code)) throw new Error('로그인 요청이 만료되었어요. 다시 시작해 주세요.');
    try {
      const result = await authRequest<{ token: string | null }>('/exchange', { code, verifier });
      if (Platform.OS !== 'web') {
        if (!result.token) throw new Error('로그인 정보를 받지 못했어요.');
        await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      }
    } finally { await clearVerifier(); }
  })();
  completion = { code, promise };
  return promise;
}
export async function logoutMember() {
  await authRequest('/logout', {});
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(TOKEN_KEY);
}
