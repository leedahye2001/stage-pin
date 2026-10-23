import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

const memories = [
  {
    id: 'memory-1',
    date: '2026.10.18',
    title: 'The Purple Hour',
    artist: 'STAGEPIN LIVE',
    venue: 'KSPO DOME',
    color: '#7355F5',
    accent: '#D9D0FF',
    icon: 'sparkles' as const,
  },
  {
    id: 'memory-2',
    date: '2026.08.30',
    title: 'Summer Letter',
    artist: 'Moonlight Band',
    venue: '인스파이어 아레나',
    color: '#FF8FAB',
    accent: '#FFE2EA',
    icon: 'sunny' as const,
  },
  {
    id: 'memory-3',
    date: '2026.05.16',
    title: 'Our First Page',
    artist: 'DAYLIGHT',
    venue: '고척스카이돔',
    color: '#29A9A0',
    accent: '#CFF5F1',
    icon: 'musical-notes' as const,
  },
  {
    id: 'memory-4',
    date: '2026.02.14',
    title: 'Love in February',
    artist: 'Solo Night',
    venue: '블루스퀘어',
    color: '#4B6FD8',
    accent: '#DCE5FF',
    icon: 'heart' as const,
  },
];

export default function LogbookScreen() {
  const [year, setYear] = useState(2026);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>CONCERT LOGBOOK</Text>
            <Text style={styles.title}>나의 무대 기록</Text>
            <Text style={styles.subtitle}>함께 노래했던 순간을 차곡차곡 모아봐요.</Text>
          </View>
          <View style={styles.bookIcon}>
            <Ionicons color={colors.primary} name="book" size={24} />
          </View>
        </View>

        <View style={styles.previewNotice}>
          <Ionicons color={colors.primary} name="images-outline" size={18} />
          <Text style={styles.previewText}>사진과 감상 기록이 쌓이면 이런 로그북이 완성돼요.</Text>
        </View>

        <Pressable onPress={() => router.push('/pinlog/create')} style={styles.createCard}>
          <View style={styles.createIcon}>
            <Ionicons color={colors.primary} name="camera" size={25} />
          </View>
          <View style={styles.createCopy}>
            <Text style={styles.createEyebrow}>NEW · STAGEPIN 4-CUT</Text>
            <Text style={styles.createTitle}>공연 가는 날 4컷 만들기</Text>
            <Text style={styles.createDescription}>사진 네 장으로 공유용 핀로그를 만들어요.</Text>
          </View>
          <Ionicons color={colors.white} name="chevron-forward" size={21} />
        </Pressable>

        <View style={styles.statsCard}>
          <Stat value="12" label="다녀온 공연" />
          <View style={styles.statDivider} />
          <Stat value="8" label="공연장" />
          <View style={styles.statDivider} />
          <Stat value="4" label="도시" />
        </View>

        <View style={styles.featuredCard}>
          <View style={styles.featuredPoster}>
            <View style={styles.posterGlow} />
            <Ionicons color={colors.white} name="sparkles" size={30} />
            <Text style={styles.posterSmall}>MY BEST MOMENT</Text>
            <Text style={styles.posterTitle}>THE{`\n`}PURPLE{`\n`}HOUR</Text>
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.favoriteBadge}>
              <Ionicons color="#FF5277" name="heart" size={13} />
              <Text style={styles.favoriteText}>올해의 순간</Text>
            </View>
            <Text style={styles.featuredTitle}>The Purple Hour</Text>
            <Text style={styles.featuredMeta}>2026.10.18 · KSPO DOME</Text>
            <Text numberOfLines={3} style={styles.featuredNote}>
              첫 곡이 시작되던 순간부터 마지막 앙코르까지, 보라색 불빛으로 가득했던 밤.
            </Text>
          </View>
        </View>

        <View style={styles.yearRow}>
          <View style={styles.yearTabs}>
            {[2026, 2025].map((item) => (
              <Pressable
                accessibilityState={{ selected: year === item }}
                key={item}
                onPress={() => setYear(item)}
                style={[styles.yearButton, year === item && styles.yearButtonSelected]}
              >
                <Text style={[styles.yearText, year === item && styles.yearTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.recordCount}>{year === 2026 ? '4개의 기록' : '아직 기록이 없어요'}</Text>
        </View>

        {year === 2026 ? (
          <View style={styles.memoryGrid}>
            {memories.map((memory) => (
              <View key={memory.id} style={styles.memoryCard}>
                <View style={[styles.memoryPoster, { backgroundColor: memory.color }]}>
                  <View style={[styles.memoryCircle, { backgroundColor: memory.accent }]} />
                  <Ionicons color={colors.white} name={memory.icon} size={26} />
                  <Text style={styles.memoryPosterTitle}>{memory.title}</Text>
                </View>
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryDate}>{memory.date}</Text>
                  <Text numberOfLines={1} style={styles.memoryTitle}>{memory.title}</Text>
                  <Text numberOfLines={1} style={styles.memoryArtist}>{memory.artist}</Text>
                  <View style={styles.venueRow}>
                    <Ionicons color={colors.textMuted} name="location-outline" size={12} />
                    <Text numberOfLines={1} style={styles.memoryVenue}>{memory.venue}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyYear}>
            <Ionicons color={colors.primary} name="book-outline" size={28} />
            <Text style={styles.emptyYearTitle}>2025년의 첫 기록을 남겨보세요.</Text>
            <Text style={styles.emptyYearText}>공연 사진과 셋리스트, 한 줄 감상을 함께 보관할 수 있어요.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  bookIcon: {
    alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    height: 48, justifyContent: 'center', width: 48,
  },
  previewNotice: {
    alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md,
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
  },
  previewText: { color: colors.primary, flex: 1, fontSize: 12, fontWeight: '700' },
  createCard: {
    alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg,
    flexDirection: 'row', gap: spacing.md, overflow: 'hidden', padding: spacing.md,
  },
  createIcon: {
    alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md,
    height: 50, justifyContent: 'center', width: 50,
  },
  createCopy: { flex: 1 },
  createEyebrow: { color: '#D9D0FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  createTitle: { color: colors.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
  createDescription: { color: 'rgba(255,255,255,0.72)', fontSize: 11, marginTop: 3 },
  statsCard: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  statDivider: { backgroundColor: colors.border, height: 34, width: 1 },
  featuredCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg,
    borderWidth: 1, flexDirection: 'row', overflow: 'hidden',
  },
  featuredPoster: {
    backgroundColor: colors.primary, justifyContent: 'flex-end', overflow: 'hidden',
    padding: spacing.md, position: 'relative', width: 138,
  },
  posterGlow: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, height: 130,
    position: 'absolute', right: -50, top: -35, width: 130,
  },
  posterSmall: { color: 'rgba(255,255,255,0.72)', fontSize: 8, fontWeight: '900', marginTop: spacing.md },
  posterTitle: { color: colors.white, fontSize: 22, fontWeight: '900', lineHeight: 22, marginTop: 4 },
  featuredContent: { flex: 1, justifyContent: 'center', padding: spacing.md },
  favoriteBadge: {
    alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFE7ED', borderRadius: radius.pill,
    flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
  },
  favoriteText: { color: '#D94B70', fontSize: 9, fontWeight: '900' },
  featuredTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: spacing.sm },
  featuredMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  featuredNote: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  yearRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  yearTabs: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexDirection: 'row', padding: 3 },
  yearButton: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  yearButtonSelected: { backgroundColor: colors.surface },
  yearText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  yearTextSelected: { color: colors.primary },
  recordCount: { color: colors.textMuted, fontSize: 12 },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  memoryCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md,
    borderWidth: 1, overflow: 'hidden', width: '47.5%',
  },
  memoryPoster: { height: 172, justifyContent: 'flex-end', overflow: 'hidden', padding: spacing.md, position: 'relative' },
  memoryCircle: {
    borderRadius: radius.pill, height: 120, opacity: 0.28, position: 'absolute', right: -35, top: -30, width: 120,
  },
  memoryPosterTitle: { color: colors.white, fontSize: 17, fontWeight: '900', lineHeight: 20, marginTop: spacing.sm },
  memoryContent: { padding: spacing.sm },
  memoryDate: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  memoryTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  memoryArtist: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  venueRow: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: spacing.sm },
  memoryVenue: { color: colors.textMuted, flex: 1, fontSize: 9 },
  emptyYear: {
    alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border,
    borderRadius: radius.lg, borderStyle: 'dashed', borderWidth: 1, padding: spacing.xl,
  },
  emptyYearTitle: { color: colors.text, fontSize: typography.body, fontWeight: '900', marginTop: spacing.md },
  emptyYearText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm, textAlign: 'center' },
});
