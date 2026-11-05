import { Platform } from 'react-native';
import { API_URL } from '@/api/concerts';
import { memberRequest } from '@/api/auth';
import { authApiBase } from '@/lib/auth-helpers';
import { goodsMetadata } from '@/lib/goods-listings';
import type { GoodsDraft } from '@/lib/goods-demo';

export type GoodsResponse = {
  id: string; ownerId: string; seller: string; artist: string; title: string;
  kind: 'SALE' | 'EXCHANGE'; price: number | null; wanted: string; conditionCode: string;
  description: string; onsite: boolean; delivery: boolean; event: string | null; createdAt: string;
  photos: { id: string; url: string; width: number; height: number }[];
};

export function goodsBase() { return authApiBase(Platform.OS, Platform.OS === 'web' ? window.location.hostname : '', API_URL!); }
export function getGoods(page = 0) { return memberRequest<GoodsResponse[]>(`/api/v1/goods?page=${page}`); }
export function getMyGoods(page = 0) { return memberRequest<GoodsResponse[]>(`/api/v1/goods/mine?page=${page}`); }
export function getGoodsDetail(id: string) { return memberRequest<GoodsResponse>(`/api/v1/goods/${encodeURIComponent(id)}`); }

export async function registerGoods(draft: GoodsDraft, requestId: string) {
  const form = new FormData();
  form.append('metadata', JSON.stringify(goodsMetadata(draft, requestId)));
  for (const [index, photo] of draft.photos.entries()) {
    if (Platform.OS === 'web') {
      if (photo.file) form.append('photos', photo.file, `photo-${index}`);
      else {
        const response = await fetch(photo.uri);
        if (!response.ok) throw new Error('첨부 사진을 읽지 못했어요. 다시 선택해 주세요.');
        form.append('photos', await response.blob(), `photo-${index}`);
      }
    } else {
      form.append('photos', { uri: photo.uri, name: `photo-${index}.jpg`, type: photo.mimeType || 'image/jpeg' } as unknown as Blob);
    }
  }
  // Let fetch set the multipart boundary; a JSON Content-Type breaks file uploads.
  return memberRequest<GoodsResponse>('/api/v1/goods', { method: 'POST', body: form });
}
