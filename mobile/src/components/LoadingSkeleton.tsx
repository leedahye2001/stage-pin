import { StyleSheet, View, type DimensionValue } from 'react-native';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';

type Kind = 'concerts' | 'goods' | 'account' | 'artists' | 'search' | 'profile' | 'detail' | 'map' | 'schedule' | 'explore';

function Block({ width = '100%', height = 14, round = 8 }: { width?: DimensionValue; height?: number; round?: number }) {
  return <View style={{ width, height, borderRadius: round, backgroundColor: '#E9EAEC' }} />;
}

function Lines() {
  return <View style={s.lines}><Block width="75%" /><Block width="55%" height={11} /></View>;
}

function Cards({ grid = false, square = false }: { grid?: boolean; square?: boolean }) {
  const layout = useResponsiveLayout();
  return <View style={grid ? s.grid : s.row}>{Array.from({ length: grid ? layout.columns : 3 }, (_, i) => <View key={i} style={grid
    ? [s.gridCard, layout.isWide && { width: layout.cardWidth, maxWidth: layout.cardWidth, flexGrow: 0 }]
    : s.card}>{square ? <View style={[s.square, layout.isWide && { height: layout.cardWidth }]} /> : <Block height={260} round={18} />}<Lines /></View>)}</View>;
}

function Profile() {
  return <View style={s.profile}><Block width={76} height={76} round={38} /><Lines /></View>;
}

export function LoadingSkeleton({ kind = 'concerts', label = '정보를 불러오는 중', grid = false }: { kind?: Kind; label?: string; grid?: boolean }) {
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={s.container}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.body}>
      {kind === 'concerts' ? <Cards grid={grid} /> : null}
      {kind === 'goods' ? <Cards grid={grid} square /> : null}
      {kind === 'account' ? <View style={[s.profile, { minHeight: 88, paddingVertical: 8, gap: 16 }]}><Block width={56} height={56} round={28} /><Lines /><Block width={76} height={44} round={22} /></View> : null}
      {kind === 'artists' ? <View style={s.row}>{[0, 1, 2, 3, 4].map(i => <View key={i} style={s.artist}><Block width={66} height={66} round={22} /><Block width={52} height={10} /></View>)}</View> : null}
      {kind === 'search' ? [0, 1, 2].map(i => <View key={i} style={s.profile}><Block width={43} height={43} round={22} /><Lines /></View>) : null}
      {kind === 'profile' ? <Profile /> : null}
      {kind === 'schedule' ? [0, 1, 2].map(i => <View key={i} style={s.schedule}><Block width={44} height={44} /><Lines /></View>) : null}
      {kind === 'detail' ? <><Block height={340} round={20} /><Block width="45%" /><Block height={25} width="85%" /><Lines /><Block height={160} round={20} /><Block height={180} round={20} /></> : null}
      {kind === 'map' ? <Block height={220} round={20} /> : null}
      {kind === 'explore' ? <><Block width={140} height={24} /><Block height={50} round={25} /><Block height={240} round={20} /><Cards /></> : null}
    </View>
  </View>;
}

const s = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  body: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  card: { width: 196, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: { width: '47%', flexGrow: 1, maxWidth: '49%', gap: 12 },
  square: { width: '100%', height: 175, borderRadius: 17, backgroundColor: '#E9EAEC' },
  artist: { width: 83, gap: 10, alignItems: 'center', paddingVertical: 5 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { flex: 1, gap: 10 },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F1F2F3' },
});
