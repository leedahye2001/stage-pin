export function favoriteWriteOwner(memberId: string | undefined, authFailed: boolean, openLogin: () => void) {
  if (memberId && !authFailed) return memberId;
  openLogin();
  return undefined;
}
