import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArtistSearchResult } from '@/api/concerts';
import { colors } from '@/theme/tokens';
import { usableArtistImage } from '@/lib/artist-media';

export function ArtistPhoto({ artist, size = 62, favorite = false, onFavoriteToggle, showCredit = true }: {
  artist: ArtistSearchResult;
  size?: number;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
  showCredit?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [credit, setCredit] = useState(false);
  const usable = usableArtistImage(artist) && artist.imageUrl !== failedUrl;
  return <View style={{ width: size, height: size + (onFavoriteToggle && showCredit ? 23 : 0) }}>
    <View style={[s.frame, { width: size, height: size, borderRadius: size / 3 }]}>
      {usable ? <Image accessibilityLabel={`${artist.name} 아티스트 사진`} source={{ uri: artist.imageUrl! }} resizeMode="cover" style={{ width: size, height: size }} onError={() => setFailedUrl(artist.imageUrl)} />
        : <Ionicons name="person-outline" size={size / 2.5} color="#9A8AAD" />}
    </View>
    {onFavoriteToggle ? <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 관심 아티스트 ${favorite ? '해제' : '찜하기'}`} accessibilityState={{ selected: favorite }} hitSlop={8} onPress={onFavoriteToggle} style={[s.info, { top: size - 24, bottom: undefined }]}><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={colors.primary} /></Pressable> : null}
    {usable && showCredit ? <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 사진 출처와 라이선스`} hitSlop={4} onPress={() => setCredit(true)} style={onFavoriteToggle ? s.creditLabel : s.info}>{onFavoriteToggle ? <Text style={s.creditText}>사진 출처</Text> : <Ionicons name="information-circle" size={18} color={colors.primary} />}</Pressable> : null}
    <PhotoCreditsModal artists={[artist]} visible={credit} onClose={() => setCredit(false)} />
  </View>;
}

export function ArtistPhotoCredits({ artists }: { artists: ArtistSearchResult[] }) {
  const [visible, setVisible] = useState(false);
  const credited = artists.filter(usableArtistImage);
  if (!credited.length) return null;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="아티스트 사진 크레딧 보기" hitSlop={8} onPress={() => setVisible(true)}><Text style={s.creditsButton}>사진 크레딧</Text></Pressable>
    <PhotoCreditsModal artists={credited} visible={visible} onClose={() => setVisible(false)} />
  </>;
}

function PhotoCreditsModal({ artists, visible, onClose }: { artists: ArtistSearchResult[]; visible: boolean; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}><View accessibilityViewIsModal style={s.modal}>
        <Text accessibilityRole="header" style={s.title}>사진 크레딧</Text>
        <ScrollView style={{ maxHeight: 440, flexShrink: 1 }} contentContainerStyle={{ gap: 24 }}>
        {artists.map(artist => <View key={artist.id} style={{ gap: 10 }}>
        <Text style={s.artistName}>{artist.name}</Text>
        <Text selectable style={s.body}>{artist.imageAttribution || 'CC0 공개 자료'}</Text>
        <Text style={s.body}>{artist.imageLicense} · Wikimedia Commons</Text>
        <Text style={s.body}>화면에 맞게 중앙 크롭·축소 표시했습니다. 공식 프로필 또는 제휴를 의미하지 않습니다.</Text>
        <Text style={s.body}>{artist.imagePageUrl?.split('/wiki/File:')[1]?.replace(/_/g, ' ')}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={`${artist.name} 원본 파일·라이선스 보기`} onPress={() => artist.imagePageUrl && Linking.openURL(artist.imagePageUrl)}><Text style={s.link}>원본 파일·라이선스 보기 ↗</Text></Pressable>
        </View>)}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="사진 출처 닫기" onPress={onClose} style={s.close}><Text style={s.link}>닫기</Text></Pressable>
      </View></View>
    </Modal>;
}

const s = StyleSheet.create({
  creditsButton: { color: colors.textMuted, fontSize: 11, paddingVertical: 8 },
  artistName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  frame: { backgroundColor: '#EEEAF5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  info: { position: 'absolute', bottom: -3, right: -5, width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  creditLabel: { alignSelf: 'center', paddingTop: 7, paddingBottom: 3 },
  creditText: { color: colors.textMuted, fontSize: 9 },
  backdrop: { flex: 1, backgroundColor: '#21192D77', padding: 24, alignItems: 'center', justifyContent: 'center' },
  modal: { width: '100%', maxWidth: 460, maxHeight: '90%', padding: 24, borderRadius: 23, backgroundColor: '#FFFFFF', gap: 17 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 21 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  close: { alignSelf: 'flex-end', padding: 10 },
});
