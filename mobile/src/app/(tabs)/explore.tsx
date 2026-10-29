import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getArtists,
  getConcerts,
  getTicketOpenings,
  type ArtistSearchResult,
  type FanCategory,
} from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { TicketingCarousel } from '@/components/TicketingCarousel';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type FanFilter = FanCategory | 'ALL';

const fanFilters: { value: FanFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'IDOL', label: '아이돌' },
  { value: 'SOLO', label: '솔로' },
  { value: 'BAND', label: '밴드' },
];

export default function ConcertDiscoveryScreen() {
  const {
    artists: favoriteArtists,
    isConcertFavorite,
    toggleConcert,
  } = useFavorites();
  const [fanFilter, setFanFilter] = useState<FanFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const serverQuery = debouncedQuery.length >= 2 ? debouncedQuery : '';
  const upcomingQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'upcoming'],
    queryFn: () => getConcerts('POPULAR_MUSIC'),
  });
  const artistSuggestionsQuery = useQuery({
    queryKey: ['artists', serverQuery],
    queryFn: () => getArtists(serverQuery),
    enabled: Boolean(serverQuery),
  });
  const ticketOpeningsQuery = useQuery({
    queryKey: ['ticket-openings'],
    queryFn: getTicketOpenings,
    retry: false,
  });
  const performanceSuggestionsQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'search', serverQuery],
    queryFn: () => getConcerts('POPULAR_MUSIC', serverQuery),
    enabled: Boolean(serverQuery),
  });

  const openConcert = (id: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id, genre: 'POPULAR_MUSIC' } });
  };

  if (upcomingQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>예정 공연을 불러오는 중이에요.</Text>
      </SafeAreaView>
    );
  }

  if (upcomingQuery.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>공연 정보를 불러오지 못했어요.</Text>
        <Text style={styles.errorMessage}>백엔드 연결과 EXPO_PUBLIC_API_URL을 확인해 주세요.</Text>
        <Pressable onPress={() => upcomingQuery.refetch()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const upcomingConcerts = upcomingQuery.data;
  const targetedConcerts = upcomingConcerts.filter((concert) => concert.fanCategory !== 'OTHER');
  const otherConcerts = upcomingConcerts.filter((concert) => concert.fanCategory === 'OTHER');
  const concerts = fanFilter === 'ALL'
    ? targetedConcerts
    : targetedConcerts.filter((concert) => concert.fanCategory === fanFilter);
  const ticketOpenings = ticketOpeningsQuery.data ?? [];
  const showSearchDropdown = searchQuery.trim().length >= 2;
  const searchIsLoading = debouncedQuery !== searchQuery.trim()
    || artistSuggestionsQuery.isFetching
    || performanceSuggestionsQuery.isFetching;
  const changeSearchQuery = (value: string) => setSearchQuery(value);

  const selectArtist = (artist?: ArtistSearchResult) => {
    const nextArtist = artist ?? artistSuggestionsQuery.data?.[0];
    if (!nextArtist) {
      if (performanceSuggestionsQuery.data?.length) selectPerformance();
      return;
    }
    if (searchIsLoading) return;
    setSearchQuery('');
    router.push({
      pathname: '/artists/[id]',
      params: { id: nextArtist.id, query: nextArtist.searchName },
    });
  };

  const selectPerformance = () => {
    if (!serverQuery || searchIsLoading) return;
    setSearchQuery('');
    router.push({ pathname: '/search', params: { query: serverQuery } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={[]}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <View>
            {upcomingConcerts.some((concert) => concert.source === 'KOPIS') ? (
              <Text style={styles.attribution}>공연 데이터: 공연예술통합전산망(KOPIS)</Text>
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identityCard}>
              <View style={styles.identityGlowLarge} />
              <View style={styles.identityGlowSmall} />
              <View style={styles.brand}>
                <Image
                  accessibilityIgnoresInvertColors
                  source={require('../../../assets/stagepin-mark.png')}
                  style={styles.brandMark}
                />
                <Text style={styles.identityEyebrow}>STAGEPIN</Text>
              </View>
              <View style={styles.identityContent}>
                <View style={styles.identityCopy}>
                  <Text style={styles.hero}>좋아하는 공연,{`\n`}공연장까지 한눈에.</Text>
                  <Text style={styles.subtitle}>아티스트와 공연을 검색하고, 지도에서 공연 장소를 찾아보세요.</Text>
                </View>
                <View style={styles.radarPin}>
                  <Ionicons color={colors.white} name="location" size={28} />
                </View>
              </View>
              <View style={styles.vendorRow}>
                {['NOL', 'YES24', '멜론티켓', '티켓링크'].map((vendor) => (
                  <View key={vendor} style={styles.vendorPill}>
                    <Text style={styles.vendorPillText}>{vendor}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.searchBox}>
              <Ionicons color={colors.textMuted} name="search" size={20} />
              <TextInput
                accessibilityLabel="공연 검색"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={changeSearchQuery}
                onSubmitEditing={() => selectArtist()}
                placeholder="아티스트 또는 공연명을 검색해보세요"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  accessibilityLabel="검색어 지우기"
                  hitSlop={10}
                  onPress={() => changeSearchQuery('')}
                >
                  <Ionicons color={colors.textMuted} name="close-circle" size={20} />
                </Pressable>
              )}
            </View>

            {showSearchDropdown ? (
              <View style={styles.searchDropdown}>
                {searchIsLoading ? (
                  <View style={styles.searchDropdownRow}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.searchDropdownDescription}>KOPIS 공연 기록을 찾는 중이에요.</Text>
                  </View>
                ) : artistSuggestionsQuery.data?.length || performanceSuggestionsQuery.data?.length ? (
                  <>
                  {artistSuggestionsQuery.data?.map((artist) => (
                    <View
                      key={artist.id}
                      style={styles.searchDropdownRow}
                    >
                      <ArtistPhoto artist={artist} size={42} />
                      <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 공연 기록 보기`} onPress={() => selectArtist(artist)} style={styles.searchDropdownContent}>
                        <Text style={styles.searchDropdownTitle}>{artist.name}</Text>
                        <Text numberOfLines={1} style={styles.searchDropdownDescription}>
                          {[artist.description, artist.aliases.filter((alias) => alias !== artist.name).slice(0, 2).join(' · ')]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </Pressable>
                      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                    </View>
                  ))}
                  {performanceSuggestionsQuery.data?.length ? (
                    <Pressable onPress={selectPerformance} style={styles.searchDropdownRow}>
                      <View style={styles.performanceIcon}>
                        <Ionicons color={colors.white} name="ticket" size={18} />
                      </View>
                      <View style={styles.searchDropdownContent}>
                        <Text style={styles.searchDropdownTitle}>‘{serverQuery}’ 공연 검색</Text>
                        <Text style={styles.searchDropdownDescription}>
                          KOPIS 공연 {performanceSuggestionsQuery.data.length}개 · 공연장 지도 보기
                        </Text>
                      </View>
                      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                    </Pressable>
                  ) : null}
                  </>
                ) : (
                  <View style={styles.searchDropdownRow}>
                    <View style={styles.searchIcon}>
                      <Ionicons color={colors.textMuted} name="search" size={18} />
                    </View>
                    <Text style={styles.searchDropdownDescription}>일치하는 아티스트를 찾지 못했어요.</Text>
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>관심 아티스트 공연</Text>
                  <Ionicons color={colors.primary} name="heart" size={18} />
                </View>
                {favoriteArtists.length ? (
                  <ScrollView
                    contentContainerStyle={styles.favoriteArtistList}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {favoriteArtists.map((artist) => (
                      <View
                        key={artist.id}
                        style={styles.favoriteArtistCard}
                      >
                        <ArtistPhoto artist={artist} size={54} />
                        <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 공연 보기`} onPress={() => selectArtist(artist)}><Text numberOfLines={1} style={styles.favoriteArtistName}>{artist.name}</Text></Pressable>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.interestCard}>
                    <View style={styles.interestIcon}>
                      <Ionicons color={colors.primary} name="sparkles" size={21} />
                    </View>
                    <View style={styles.interestContent}>
                      <Text style={styles.interestTitle}>좋아하는 아티스트부터 찾아볼까요?</Text>
                      <Text style={styles.interestDescription}>
                        아티스트를 검색하고 하트를 누르면 이곳에서 바로 만날 수 있어요.
                      </Text>
                    </View>
                  </View>
                )}
            </View>

            <>
                <TicketingCarousel
                  openings={ticketOpenings}
                  scheduleType="FAN_PRESALE"
                  title="곧 열리는 선예매"
                />
                <TicketingCarousel
                  openings={ticketOpenings}
                  scheduleType="GENERAL_SALE"
                  title="곧 열리는 일반예매"
                />

                <View style={styles.section}>
                  <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitle}>다가오는 무대</Text>
                    <Text style={styles.count}>{concerts.length}</Text>
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.genreList}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {fanFilters.map((item) => {
                      const selected = item.value === fanFilter;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          key={item.value}
                          onPress={() => setFanFilter(item.value)}
                          style={[styles.genreChip, selected && styles.genreChipSelected]}
                        >
                          <Text style={[styles.genreLabel, selected && styles.genreLabelSelected]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.classificationNote}>KOPIS 공연명·출연진 기준 자동 분류</Text>
                  {concerts.length ? (
                    <FlatList
                      contentContainerStyle={styles.concertList}
                      data={concerts}
                      decelerationRate="fast"
                      horizontal
                      keyExtractor={(concert) => concert.id}
                      renderItem={({ item }) => (
                        <ConcertCard
                          concert={item}
                          favorite={isConcertFavorite(item.id)}
                          onFavoriteToggle={() => toggleConcert(item)}
                          onPress={() => openConcert(item.id)}
                        />
                      )}
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={196 + spacing.md}
                    />
                  ) : (
                    <Text style={styles.empty}>해당 분류의 예정 공연이 아직 없어요.</Text>
                  )}
                </View>
            </>

            {upcomingConcerts.length ? (
              <View style={styles.section}>
                <View>
                  <Text style={styles.sectionTitle}>공연 장소 한눈에 보기</Text>
                  <Text style={styles.sectionCaption}>
                    핀을 누르면 해당 공연의 상세 정보를 볼 수 있어요.
                  </Text>
                </View>
                <ConcertMap concerts={upcomingConcerts} onSelect={openConcert} />
              </View>
            ) : null}

            {otherConcerts.length ? (
              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>그 외 KOPIS 공연</Text>
                  <Text style={styles.count}>{otherConcerts.length}</Text>
                </View>
                <FlatList
                  contentContainerStyle={styles.concertList}
                  data={otherConcerts}
                  horizontal
                  keyExtractor={(concert) => concert.id}
                  renderItem={({ item }) => (
                    <ConcertCard
                      concert={item}
                      favorite={isConcertFavorite(item.id)}
                      onFavoriteToggle={() => toggleConcert(item)}
                      onPress={() => openConcert(item.id)}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ) : null}
          </View>
        }
        renderItem={() => null}
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
    paddingBottom: 100,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brandMark: {
    height: 28,
    width: 28,
  },
  identityCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'relative',
  },
  identityGlowLarge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.pill,
    height: 190,
    position: 'absolute',
    right: -70,
    top: -90,
    width: 190,
  },
  identityGlowSmall: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    bottom: -45,
    height: 110,
    left: -25,
    position: 'absolute',
    width: 110,
  },
  identityEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  identityContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  identityCopy: {
    flex: 1,
  },
  hero: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  radarPin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  vendorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vendorPill: {
    backgroundColor: colors.button,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vendorPillText: {
    color: colors.buttonText,
    fontSize: 10,
    fontWeight: '800',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingVertical: 14,
  },
  searchDropdown: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: -spacing.md,
    overflow: 'hidden',
  },
  searchDropdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 66,
    paddingHorizontal: spacing.md,
  },
  searchDropdownContent: {
    flex: 1,
  },
  searchDropdownTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  searchDropdownDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  searchIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  performanceIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  artistAvatar: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 42,
    width: 42,
  },
  section: {
    gap: spacing.md,
  },
  interestCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  interestIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  interestContent: {
    flex: 1,
  },
  interestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  interestDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  favoriteArtistList: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  favoriteArtistCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
    width: 92,
  },
  favoriteArtistImage: {
    borderRadius: radius.pill,
    height: 52,
    width: 52,
  },
  favoriteArtistFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  favoriteArtistName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '100%',
  },
  genreList: {
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  genreChipSelected: {
    backgroundColor: colors.buttonText,
    borderColor: colors.buttonText,
  },
  genreLabel: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  genreLabelSelected: {
    color: colors.white,
  },
  classificationNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -spacing.md,
  },
  empty: {
    color: colors.textMuted,
    paddingVertical: spacing.xl,
    textAlign: 'center',
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
  sectionCaption: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
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
  concertList: {
    gap: spacing.md,
    paddingRight: spacing.md,
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
  attribution: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
