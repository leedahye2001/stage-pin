export function favoritePress(event: { stopPropagation: () => void }, toggle: () => void) {
  event.stopPropagation();
  toggle();
}
