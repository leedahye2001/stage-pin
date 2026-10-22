import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConcerts } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const concertsQuery = useQuery({
    queryKey: ['concerts'],
    queryFn: getConcerts,
  });

  const openConcert = (id: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id } });
  };

  if (concertsQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>공연 지도를 불러오는 중이에요.</Text>
      </SafeAreaView>
    );
  }

  if (concertsQuery.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>공연 정보를 불러오지 못했어요.</Text>
        <Text style={styles.errorMessage}>백엔드 연결과 EXPO_PUBLIC_API_URL을 확인해 주세요.</Text>
        <Pressable onPress={() => concertsQuery.refetch()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={concertsQuery.data}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(concert) => concert.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>STAGEPIN</Text>
              <Text style={styles.hero}>다음 무대를{`\n`}놓치지 마세요.</Text>
              <Text style={styles.subtitle}>공연과 티켓팅 일정을 한 지도에서 확인해요.</Text>
            </View>

            <ConcertMap concerts={concertsQuery.data} onSelect={openConcert} />

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>예정 공연</Text>
              <Text style={styles.count}>{concertsQuery.data.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <ConcertCard concert={item} onPress={() => openConcert(item.id)} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  hero: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  count: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  retryLabel: {
    color: colors.white,
    fontWeight: '800',
  },
});

