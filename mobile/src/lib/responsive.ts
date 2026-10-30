export function responsiveLayout(width: number) {
  const isWide = width >= 768;
  const isDesktop = width >= 1024;
  const columns = isDesktop ? 4 : isWide ? 3 : 2;
  const padding = isWide ? 32 : 20;
  const contentWidth = Math.max(0, Math.min(width, isWide ? 1200 : 1000) - padding * 2);
  // A browser may round window width up while the container keeps a fractional pixel.
  return { isWide, isDesktop, columns, cardWidth: Math.max(0, Math.floor((contentWidth - (columns - 1) * 14 - 1) / columns)) };
}
