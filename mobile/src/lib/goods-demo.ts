export const demoArtists = [
  { name: 'SEVENTEEN', aliases: '세븐틴 svt', short: 'SVT', color: '#F5CCD9', ink: '#8A526C' },
  { name: 'IVE', aliases: '아이브', short: 'IVE', color: '#D9D3F9', ink: '#63508C' },
  { name: 'aespa', aliases: '에스파', short: 'æ', color: '#BEE8EC', ink: '#34636E' },
  { name: 'DAY6', aliases: '데이식스', short: 'D6', color: '#D6E9BE', ink: '#526940' },
  { name: 'BTS', aliases: '방탄소년단 방탄', short: 'BTS', color: '#E1D3F6', ink: '#77578E' },
];

export type DemoGoods = {
  id: string; artist: string; member: string; title: string; kind: '교환' | '판매';
  category: string; color: string; ink: string; mark: string; price: number | null;
  wanted: string; condition: string; methods: string[]; event: string | null;
  seller: string; time: string; description: string; status: '거래 가능' | '예약 중';
  conditionCode?: string; photos?: GoodsPhoto[];
};

export const goodsConditions = [
  { code: 'SEALED', label: '미개봉' },
  { code: 'OPENED_UNUSED', label: '개봉 · 미사용' },
  { code: 'USED_GOOD', label: '사용감 적음' },
  { code: 'USED_FAIR', label: '사용감 있음' },
  { code: 'DAMAGED', label: '하자 있음' },
] as const;
export type GoodsPhoto = { uri: string; width: number; height: number; fileSize?: number; mimeType?: string };
export const MAX_GOODS_PHOTOS = 5;
export function digitsOnly(value: string) { return value.replace(/[^0-9]/g, ''); }
export function validateGoodsPhotos(photos: GoodsPhoto[]) {
  if (!photos.length) throw new Error('굿즈 상태를 확인할 수 있는 사진을 1장 이상 첨부해 주세요.');
  if (photos.length > MAX_GOODS_PHOTOS) throw new Error('사진은 최대 5장까지 첨부할 수 있어요.');
  if (photos.some((photo) => !photo.uri || !(photo.width > 0) || !(photo.height > 0)
    || (photo.mimeType && !/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(photo.mimeType)))) throw new Error('지원하는 사진 파일을 선택해 주세요.');
  if (photos.some((photo) => photo.fileSize !== undefined && (!Number.isFinite(photo.fileSize) || photo.fileSize <= 0 || photo.fileSize > 10 * 1024 * 1024))) throw new Error('사진은 장당 10MB 이하로 첨부해 주세요.');
}

export const demoGoods: DemoGoods[] = [
  { id: 'demo-svt-1', artist: 'SEVENTEEN', member: '원우', title: '원우 포토카드, 민규로 교환해요', kind: '교환', category: '포토카드', color: '#F8DCE5', ink: '#8A526C', mark: 'W', price: null, wanted: '같은 시리즈 민규 포토카드', condition: '개봉 · 눈에 띄는 하자 없음', methods: ['현장'], event: '11.14 · SEVENTEEN 가상 팬콘', seller: '봉봉수집가', time: '방금', description: '슬리브에 보관한 샘플 포토카드예요. 같은 시리즈 민규로 교환하고 싶어요. 현장에서는 상태를 서로 확인한 뒤 교환해요.', status: '거래 가능' },
  { id: 'demo-ive-1', artist: 'IVE', member: '장원영', title: '장원영 앨범 포카 양도해요', kind: '판매', category: '포토카드', color: '#E5DDFB', ink: '#7256A0', mark: 'WY', price: 8000, wanted: '', condition: '개봉 · 뒷면 작은 눌림 있음', methods: ['현장', '택배'], event: '11.21 · IVE 가상 팬미팅', seller: '다이브의서랍', time: '5분 전', description: '컬렉션을 정리하며 올리는 데모 상품입니다. 뒷면 모서리에 작은 눌림이 있는 설정이에요. 택배비는 별도이며 실제 판매하지 않습니다.', status: '거래 가능' },
  { id: 'demo-aespa-1', artist: 'aespa', member: '윈터', title: '윈터 ↔ 카리나, 현장 교환 구해요', kind: '교환', category: '포토카드', color: '#CBEAF0', ink: '#3E6D7E', mark: 'W', price: null, wanted: '카리나 포토카드 · 동일 시리즈', condition: '미개봉', methods: ['현장'], event: '11.28 · aespa 가상 콘서트', seller: '겨울주머니', time: '12분 전', description: '같은 공연에 가는 분과 현장 교환을 원하는 예시입니다. 구체적인 만남 위치는 공개 글이 아닌 거래 대화에서 정해요.', status: '거래 가능' },
  { id: 'demo-day6-1', artist: 'DAY6', member: 'Young K', title: '영케이 포카를 원필 포카로', kind: '교환', category: '포토카드', color: '#DFEBCB', ink: '#587044', mark: 'YK', price: null, wanted: '원필 포토카드', condition: '개봉 · 슬리브 보관', methods: ['현장', '택배'], event: '12.05 · DAY6 가상 콘서트', seller: '마이데이한칸', time: '18분 전', description: '아이돌뿐 아니라 밴드 팬도 함께 이용할 수 있어요. 교환이 맞으면 현장 또는 택배 중 편한 방법을 정하는 샘플 글입니다.', status: '거래 가능' },
  { id: 'demo-svt-2', artist: 'SEVENTEEN', member: '전체', title: '작은 캐럿 키링, 새 주인 찾아요', kind: '판매', category: '키링', color: '#FCE5D5', ink: '#A07450', mark: '✦', price: 12000, wanted: '', condition: '미사용 · 포장 없음', methods: ['현장', '택배'], event: '11.14 · SEVENTEEN 가상 팬콘', seller: '복숭아캐럿', time: '25분 전', description: '화면 디자인을 위해 만든 가상 키링 상품이에요. 공식 상품 여부를 보증하는 정보가 아니며 실제로 주문할 수 없습니다.', status: '거래 가능' },
  { id: 'demo-bts-1', artist: 'BTS', member: '전체', title: '보라빛 응원봉 파우치', kind: '판매', category: '기타 굿즈', color: '#E2D9F3', ink: '#806094', mark: '♡', price: 15000, wanted: '', condition: '사용감 있음 · 상세 확인', methods: ['택배'], event: null, seller: '보라빛상자', time: '32분 전', description: '응원봉을 담는 파우치의 가상 판매 글입니다. 실물 사진 대신 직접 그린 샘플 일러스트를 사용하고 있어요.', status: '예약 중' },
  { id: 'demo-ive-2', artist: 'IVE', member: '안유진', title: '유진 미니 엽서, 이서로 교환', kind: '교환', category: '엽서', color: '#F4EFCB', ink: '#8C8040', mark: 'YJ', price: null, wanted: '이서 미니 엽서', condition: '미개봉', methods: ['택배'], event: null, seller: '유진의계절', time: '40분 전', description: '서로 원하는 멤버의 엽서를 교환하는 샘플입니다. 교환 신청은 데모 내역에만 추가되고 상대방에게 전달되지 않아요.', status: '거래 가능' },
  { id: 'demo-aespa-2', artist: 'aespa', member: '카리나', title: '카리나 포토카드 홀더', kind: '판매', category: '기타 굿즈', color: '#D5E6F7', ink: '#4D719B', mark: 'K', price: 6000, wanted: '', condition: '개봉 · 미사용', methods: ['현장', '택배'], event: '11.28 · aespa 가상 콘서트', seller: '에스파스테이션', time: '1시간 전', description: '포카 홀더 형태를 보여주는 샘플 상품이에요. 모든 닉네임, 가격, 거래 상태는 임의로 만든 목업 데이터입니다.', status: '거래 가능' },
];

export function filterDemoGoods(items: DemoGoods[], artist: string, kind: string, query: string, onsiteOnly = false) {
  const normalized = query.toLocaleLowerCase().replace(/\s/g, '');
  return items.filter((item) => (artist === '전체' || item.artist === artist)
    && (kind === '전체' || item.kind === kind)
    && (!onsiteOnly || (item.methods.includes('현장') && Boolean(item.event)))
    && `${item.title}${item.artist}${demoArtists.find((entry) => entry.name === item.artist)?.aliases ?? ''}${item.member}${item.category}${item.wanted}`.toLocaleLowerCase().replace(/\s/g, '').includes(normalized));
}

export function goodsPrice(item: DemoGoods) {
  return item.kind === '교환' ? '교환해요' : `${item.price?.toLocaleString('ko-KR')}원`;
}

export type GoodsDraft = {
  artist: string; title: string; kind: '교환' | '판매'; price: string; wanted: string;
  condition: string; photos: GoodsPhoto[]; description: string; onsite: boolean; delivery: boolean; event: string;
};

export function createDemoListing(draft: GoodsDraft, id: string): DemoGoods {
  if (!draft.artist.trim() || !draft.title.trim() || !draft.condition.trim()) throw new Error('아티스트, 제목, 굿즈 상태를 입력해 주세요.');
  const condition = goodsConditions.find((entry) => entry.code === draft.condition);
  if (!condition) throw new Error('굿즈 상태를 목록에서 선택해 주세요.');
  validateGoodsPhotos(draft.photos);
  if (draft.title.trim().length > 80 || draft.artist.trim().length > 60) throw new Error('아티스트는 60자, 제목은 80자 이내로 입력해 주세요.');
  if (!draft.onsite && !draft.delivery) throw new Error('거래 방식을 하나 이상 골라 주세요.');
  if (draft.onsite && !draft.event.trim()) throw new Error('현장 거래할 공연명을 입력해 주세요.');
  if (draft.kind === '교환' && !draft.wanted.trim()) throw new Error('교환으로 구하는 굿즈를 입력해 주세요.');
  const price = Number(draft.price);
  if (draft.kind === '판매' && (!/^\d+$/.test(draft.price) || !Number.isSafeInteger(price) || price <= 0 || price > 100000000)) throw new Error('판매 가격은 1원부터 1억 원까지 정수로 입력해 주세요.');
  const artist = demoArtists.find((item) => [item.name, ...item.aliases.split(' ')].some((name) => name.toLowerCase() === draft.artist.trim().toLowerCase()));
  return { id, artist: artist?.name ?? draft.artist.trim(), member: '전체', title: draft.title.trim(), kind: draft.kind,
    category: '기타 굿즈', color: artist?.color ?? '#E6DDF6', ink: artist?.ink ?? '#77578E', mark: artist?.short ?? '♡',
    price: draft.kind === '판매' ? price : null, wanted: draft.kind === '교환' ? draft.wanted.trim() : '',
    condition: condition.label, conditionCode: condition.code, photos: draft.photos.map((photo) => ({ ...photo })), description: draft.description.trim(), methods: [...(draft.onsite ? ['현장'] : []), ...(draft.delivery ? ['택배'] : [])],
    event: draft.onsite ? draft.event.trim() : null, seller: '나 · 로컬 미리보기', time: '방금', status: '거래 가능' };
}
