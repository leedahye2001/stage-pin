import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
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
  getNaverSearch,
  type ArtistSearchResult,
  type FanCategory,
} from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type FanFilter = FanCategory | 'ALL';

const fanFilters: { value: FanFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'IDOL', label: '아이돌' },
  { value: 'SOLO', label: '솔로' },
  { value: 'BAND', label: '밴드' },
];

const cleanNaverText = (value: string) => value.replaceAll('<b>', '').replaceAll('</b>', '');

export default function HomeScreen() {
  const [fanFilter, setFanFilter] = useState<FanFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
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
  const artistConcertQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'artist', selectedArtist?.searchName],
    queryFn: () => getConcerts('POPULAR_MUSIC', selectedArtist?.searchName),
    enabled: Boolean(selectedArtist),
  });
  const naverSearchQuery = useQuery({
    queryKey: ['naver-search', selectedArtist?.searchName],
    queryFn: () => getNaverSearch(selectedArtist?.searchName ?? ''),
    enabled: Boolean(selectedArtist),
  });

  const openConcert = (id: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id, genre: 'POPULAR_MUSIC' } });
  };

  if (upcomingQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>공연 지도를 불러오는 중이에요.</Text>
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

  const sourceConcerts = selectedArtist ? (artistConcertQuery.data ?? []) : upcomingQuery.data;
  const concerts = fanFilter === 'ALL'
    ? sourceConcerts
    : sourceConcerts.filter((concert) => concert.fanCategory === fanFilter);
  const showSearchDropdown = searchQuery.trim().length >= 2 && !selectedArtist;
  const searchIsLoading = debouncedQuery !== searchQuery.trim() || artistSuggestionsQuery.isFetching;

  const changeSearchQuery = (value: string) => {
    setSearchQuery(value);
    setSelectedArtist(null);
  };

  const selectArtist = (artist?: ArtistSearchResult) => {
    const nextArtist = artist ?? artistSuggestionsQuery.data?.[0];
    if (!nextArtist || searchIsLoading) return;
    setSelectedArtist(nextArtist);
    setSearchQuery(nextArtist.name);
    setFanFilter('ALL');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={concerts}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(concert) => concert.id}
        ListFooterComponent={
          <View>
            {sourceConcerts.some((concert) => concert.source === 'KOPIS') ? (
              <Text style={styles.attribution}>공연 데이터: 공연예술통합전산망(KOPIS)</Text>
            ) : null}
            {selectedArtist ? (
              <View style={styles.naverSection}>
                <Text style={styles.sectionTitle}>네이버 관련 정보</Text>
                <Text style={styles.naverCaption}>네이버 검색 결과 · 원문에서 내용을 확인해 주세요.</Text>
                {naverSearchQuery.isPending ? (
                  <ActivityIndicator color={colors.primary} style={styles.naverLoading} />
                ) : naverSearchQuery.data?.enabled === false ? (
                  <Text style={styles.naverEmpty}>
                    NAVER API HUB 키를 설정하면 관련 공식 공지와 예매 페이지가 표시돼요.
                  </Text>
                ) : naverSearchQuery.data?.items.length ? (
                  naverSearchQuery.data.items.map((item) => (
                    <Pressable
                      accessibilityRole="link"
                      key={item.link}
                      onPress={() => Linking.openURL(item.link)}
                      style={styles.naverResult}
                    >
                      <Text numberOfLines={1} style={styles.naverTitle}>
                        {cleanNaverText(item.title)}
                      </Text>
                      <Text numberOfLines={2} style={styles.naverDescription}>
                        {cleanNaverText(item.description)}
                      </Text>
                      <Text style={styles.naverLink}>네이버 검색 결과 열기 ›</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.naverEmpty}>관련 네이버 검색 결과가 없어요.</Text>
                )}
              </View>
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <View style={styles.brand}>
                <Image
                  accessibilityIgnoresInvertColors
                  source={require('../../../assets/stagepin-mark.png')}
                  style={styles.brandMark}
                />
                <Text style={styles.eyebrow}>STAGEPIN</Text>
              </View>
              <Text style={styles.hero}>다음 무대를{`\n`}놓치지 마세요.</Text>
              <Text style={styles.subtitle}>공연과 티켓팅 일정을 한 지도에서 확인해요.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons color={colors.textMuted} name="search" size={20} />
              <TextInput
                accessibilityLabel="공연 검색"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={changeSearchQuery}
                onSubmitEditing={() => selectArtist()}
                placeholder="아티스트를 검색해보세요"
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
                ) : artistSuggestionsQuery.data?.length ? (
                  artistSuggestionsQuery.data.map((artist) => (
                    <Pressable
                      key={artist.id}
                      onPress={() => selectArtist(artist)}
                      style={styles.searchDropdownRow}
                    >
                      {artist.imageUrl ? (
                        <Image
                          accessibilityIgnoresInvertColors
                          source={{ uri: artist.imageUrl }}
                          style={styles.artistAvatar}
                        />
                      ) : (
                        <View style={styles.searchIcon}>
                          <Ionicons color={colors.primary} name="person" size={18} />
                        </View>
                      )}
                      <View style={styles.searchDropdownContent}>
                        <Text style={styles.searchDropdownTitle}>{artist.name}</Text>
                        <Text numberOfLines={1} style={styles.searchDropdownDescription}>
                          {[artist.description, artist.aliases.filter((alias) => alias !== artist.name).slice(0, 2).join(' · ')]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                    </Pressable>
                  ))
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

            {selectedArtist ? (
              <View style={styles.selectedArtistCard}>
                {selectedArtist.imageUrl ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: selectedArtist.imageUrl }}
                    style={styles.selectedArtistImage}
                  />
                ) : null}
                <View style={styles.selectedArtistContent}>
                  <Text style={styles.selectedArtistName}>{selectedArtist.name}</Text>
                  {selectedArtist.description ? (
                    <Text style={styles.selectedArtistDescription}>{selectedArtist.description}</Text>
                  ) : null}
                  {selectedArtist.imagePageUrl ? (
                    <Text
                      accessibilityRole="link"
                      onPress={() => Linking.openURL(selectedArtist.imagePageUrl!)}
                      style={styles.imageCredit}
                    >
                      사진: {selectedArtist.imageAttribution || 'Wikimedia Commons'}
                      {selectedArtist.imageLicense ? ` · ${selectedArtist.imageLicense}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

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

            <Text style={styles.classificationNote}>
              {selectedArtist ? `‘${selectedArtist.searchName}’로 KOPIS 공연 검색` : 'KOPIS 공연명·출연진 기준 자동 분류'}
            </Text>

            {concerts.length ? <ConcertMap concerts={concerts} onSelect={openConcert} /> : null}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {selectedArtist ? `${selectedArtist.name} 공연 기록` : '예정 공연'}
              </Text>
              <Text style={styles.count}>{concerts.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {selectedArtist
              ? `KOPIS에 등록된 ‘${selectedArtist.searchName}’ 공연 기록이 없어요.`
              : '해당 분류의 예정 공연이 아직 없어요.'}
          </Text>
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
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brandMark: {
    height: 28,
    width: 28,
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
  artistAvatar: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 42,
    width: 42,
  },
  selectedArtistCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  selectedArtistImage: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 64,
    width: 64,
  },
  selectedArtistContent: {
    flex: 1,
  },
  selectedArtistName: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
  },
  selectedArtistDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  imageCredit: {
    color: colors.primary,
    fontSize: 10,
    marginTop: spacing.xs,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  attribution: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  naverSection: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  naverCaption: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: -spacing.xs,
  },
  naverLoading: {
    marginVertical: spacing.lg,
  },
  naverResult: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  naverTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  naverDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  naverLink: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  naverEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    color: colors.textMuted,
    lineHeight: 20,
    padding: spacing.md,
  },
});
