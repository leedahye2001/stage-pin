export const myCollections = [
  { id: 'concerts', label: '찜한 공연', skeleton: 'concerts' },
  { id: 'artists', label: '관심 아티스트', skeleton: 'artists' },
  { id: 'listings', label: '내 등록 굿즈', skeleton: 'goods' },
  { id: 'goods', label: '찜한 굿즈', skeleton: 'goods' },
] as const;

export function memberCollections(memberId: string | undefined, authFailed: boolean) {
  return memberId && !authFailed ? myCollections : [];
}

export function collectionViewState({ authPending, requiresLogin, hasItems, pending, failed }: {
  authPending: boolean; requiresLogin: boolean; hasItems: boolean; pending: boolean; failed: boolean;
}): 'loading' | 'login' | 'content' | 'error' | 'empty' {
  if (authPending) return 'loading';
  if (requiresLogin) return 'login';
  if (hasItems) return 'content';
  if (failed) return 'error';
  return pending ? 'loading' : 'empty';
}
