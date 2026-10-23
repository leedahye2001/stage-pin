import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getArtists, getConcerts, getNaverSearch } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const cleanHtml = (value: string) => value.replace(/<[^>]*>/g, '');

export default function ArtistScreen() {
  const { id, query } = useLocalSearchParams<{ id: string; query: string }>();
  const searchName = Array.isArray(query) ? query[0] : query;
  const artistId = Array.isArray(id) ? id[0] : id;
  const { isArtistFavorite, isConcertFavorite, toggleArtist, toggleConcert } = useFavorites();

  const artistQuery = useQuery({
    queryKey: ['artists', searchName],
    queryFn: () => getArtists(searchName),
    enabled: Boolean(searchName),
  });
  const concertsQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'artist', searchName],
    queryFn: () => getConcerts('POPULAR_MUSIC', searchName),
    enabled: Boolean(searchName),
  });
  const naverQuery = useQuery({
    queryKey: ['naver-search', searchName],
    queryFn: () => getNaverSearch(searchName),
    enabled: Boolean(searchName),
    retry: false,
  });

  const artist = artistQuery.data?.find((item) => item.id === artistId) ?? artistQuery.data?.[0];
  const concerts = concertsQuery.data ?? [];
  const isLoading = artistQuery.isPending || concertsQuery.isPending;
  const openConcert = (concertId: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id: concertId, genre: 'POPULAR_MUSIC' } });
  };

  if (!searchName) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.empty}>검색어가 없어요. 홈에서 아티스트를 다시 선택해 주세요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.centeredSection}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.muted}>아티스트의 무대를 모으는 중이에요.</Text>
          </View>
        ) : artist ? (
          <View style={styles.profileCard}>
            {artist.imageUrl ? (
              <Image accessibilityIgnoresInvertColors source={{ uri: artist.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons color={colors.primary} name="musical-notes" size={30} />
              </View>
            )}
            <View style={styles.profileCopy}>
              <Text style={styles.artistName}>{artist.name}</Text>
              {artist.description ? <Text style={styles.description}>{artist.description}</Text> : null}
              {artist.aliases.length ? (
                <Text style={styles.aliases}>{artist.aliases.slice(0, 4).join(' · ')}</Text>
              ) : null}
              {artist.imagePageUrl ? (
                <Text
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(artist.imagePageUrl!)}
                  style={styles.credit}
                >
                  사진 출처: {artist.imageAttribution || 'Wikimedia Commons'}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel={isArtistFavorite(artist.id) ? '관심 아티스트 해제' : '관심 아티스트로 저장'}
              onPress={() => toggleArtist(artist)}
              style={styles.favoriteButton}
            >
              <Ionicons
                color={colors.primary}
                name={isArtistFavorite(artist.id) ? 'heart' : 'heart-outline'}
                size={25}
              />
            </Pressable>
          </View>
        ) : (
          <Text style={styles.empty}>아티스트 정보를 찾지 못했어요.</Text>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>공연 기록</Text>
            <Text style={styles.count}>{concerts.length}</Text>
          </View>
          {concertsQuery.isError ? (
            <Text style={styles.empty}>공연 기록을 불러오지 못했어요.</Text>
          ) : concerts.length ? (
            <FlatList
              contentContainerStyle={styles.concertList}
              data={concerts}
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
          ) : !concertsQuery.isPending ? (
            <Text style={styles.empty}>KOPIS에 등록된 ‘{searchName}’ 공연 기록이 없어요.</Text>
          ) : null}
        </View>

        {concerts.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>공연 장소 한눈에 보기</Text>
            <Text style={styles.caption}>핀을 누르면 공연 상세로 이동해요.</Text>
            <ConcertMap concerts={concerts} onSelect={openConcert} />
          </View>
        ) : null}

        {naverQuery.data?.enabled && naverQuery.data.items.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관련 공식 소식 더 보기</Text>
            <Text style={styles.caption}>누락된 팬미팅·공연 정보는 원문에서 확인해 주세요.</Text>
            {naverQuery.data.items.slice(0, 3).map((item) => (
              <Pressable key={item.link} onPress={() => Linking.openURL(item.link)} style={styles.newsCard}>
                <Text numberOfLines={2} style={styles.newsTitle}>{cleanHtml(item.title)}</Text>
                <Text numberOfLines={2} style={styles.newsDescription}>{cleanHtml(item.description)}</Text>
                <Text style={styles.newsLink}>원문 열기</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {concerts.some((concert) => concert.source === 'KOPIS') ? (
          <Text style={styles.attribution}>공연 데이터: 공연예술통합전산망(KOPIS)</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.xl, padding: spacing.md, paddingBottom: spacing.xl },
  centered: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.lg },
  centeredSection: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  muted: { color: colors.textMuted },
  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  avatar: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 76, width: 76 },
  avatarFallback: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 76, justifyContent: 'center', width: 76 },
  profileCopy: { flex: 1 },
  artistName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: typography.caption, marginTop: 4 },
  aliases: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 5 },
  credit: { color: colors.textMuted, fontSize: 9, marginTop: 6 },
  favoriteButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  section: { gap: spacing.md },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.title, fontWeight: '900' },
  caption: { color: colors.textMuted, fontSize: typography.caption, marginTop: -spacing.sm },
  count: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, color: colors.primary, fontSize: 12, fontWeight: '800', overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  concertList: { gap: spacing.md, paddingRight: spacing.md },
  empty: { color: colors.textMuted, lineHeight: 21, paddingVertical: spacing.xl, textAlign: 'center' },
  newsCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  newsTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  newsDescription: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.xs },
  newsLink: { color: colors.primary, fontSize: typography.caption, fontWeight: '800', marginTop: spacing.sm },
  attribution: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
