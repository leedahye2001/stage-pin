import type { GoodsResponse } from '../api/goods';
import { createDemoListing, demoArtists, goodsConditions, type DemoGoods, type GoodsDraft } from './goods-demo';

export function goodsMetadata(draft: GoodsDraft, requestId: string) {
  const validated = createDemoListing(draft, requestId);
  if (draft.wanted.trim().length > 200 || draft.event.trim().length > 200 || draft.description.trim().length > 1000)
    throw new Error('교환 굿즈·공연명은 200자, 설명은 1,000자 이내로 입력해 주세요.');
  return { requestId, artist: validated.artist, title: validated.title, kind: draft.kind === '판매' ? 'SALE' : 'EXCHANGE',
    price: draft.kind === '판매' ? draft.price : null, wanted: validated.wanted, conditionCode: draft.condition,
    description: draft.description.trim(), onsite: draft.onsite, delivery: draft.delivery, event: validated.event };
}

export type GoodsItem = DemoGoods & { ownerId: string; createdAt: string };

export function goodsItem(data: GoodsResponse, base: string): GoodsItem {
  const artist = demoArtists.find(entry => entry.name === data.artist);
  return { id: data.id, ownerId: data.ownerId, createdAt: data.createdAt, seller: data.seller,
    artist: data.artist, title: data.title, kind: data.kind === 'SALE' ? '판매' : '교환', price: data.price,
    wanted: data.wanted, condition: goodsConditions.find(entry => entry.code === data.conditionCode)?.label ?? '상태 확인',
    conditionCode: data.conditionCode, description: data.description,
    methods: [...(data.onsite ? ['현장'] : []), ...(data.delivery ? ['택배'] : [])], event: data.event,
    photos: data.photos.map(photo => ({ uri: `${base}${photo.url}`, width: photo.width, height: photo.height })),
    member: '전체', category: '기타 굿즈', color: artist?.color ?? '#F4F4F5', ink: artist?.ink ?? '#717276',
    mark: artist?.short ?? '', time: new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(data.createdAt)),
    status: '거래 가능' };
}
