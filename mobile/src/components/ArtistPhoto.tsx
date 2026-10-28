import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArtistSearchResult } from '@/api/concerts';
import { colors } from '@/theme/tokens';
import { usableArtistImage } from '@/lib/artist-media';

export function ArtistPhoto({ artist, size = 62 }: { artist: ArtistSearchResult; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [credit, setCredit] = useState(false);
  const usable = usableArtistImage(artist) && artist.imageUrl !== failedUrl;
  return <View style={{ width: size, height: size }}>
    <View style={[s.frame, { width: size, height: size, borderRadius: size / 3 }]}>
      {usable ? <Image accessibilityLabel={`${artist.name} 아티스트 사진`} source={{ uri: artist.imageUrl! }} resizeMode="cover" style={{ width: size, height: size }} onError={() => setFailedUrl(artist.imageUrl)} />
        : <Ionicons name="person-outline" size={size / 2.5} color="#9A8AAD" />}
    </View>
    {usable ? <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 사진 출처와 라이선스`} onPress={() => setCredit(true)} style={s.info}><Ionicons name="information-circle" size={18} color={colors.primary} /></Pressable> : null}
    <Modal visible={credit} transparent animationType="fade" onRequestClose={() => setCredit(false)}>
      <View style={s.backdrop}><View accessibilityViewIsModal style={s.modal}>
        <Text style={s.title}>{artist.name} 사진 출처</Text>
        <Text selectable style={s.body}>{artist.imageAttribution || 'CC0 공개 자료'}</Text>
        <Text style={s.body}>{artist.imageLicense} · Wikimedia Commons</Text>
        <Text style={s.body}>화면에 맞게 중앙 크롭·축소 표시했습니다. 공식 프로필 또는 제휴를 의미하지 않습니다.</Text>
        <Text style={s.body}>{artist.imagePageUrl?.split('/wiki/File:')[1]?.replace(/_/g, ' ')}</Text>
        <Pressable accessibilityRole="link" onPress={() => artist.imagePageUrl && Linking.openURL(artist.imagePageUrl)}><Text style={s.link}>원본 파일·라이선스 보기 ↗</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="사진 출처 닫기" onPress={() => setCredit(false)} style={s.close}><Text style={s.link}>닫기</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  frame: { backgroundColor: '#EEEAF5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  info: { position: 'absolute', bottom: -3, right: -5, width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: '#21192D77', padding: 24, alignItems: 'center', justifyContent: 'center' },
  modal: { width: '100%', maxWidth: 460, padding: 24, borderRadius: 23, backgroundColor: '#FFFFFF', gap: 17 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 21 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  close: { alignSelf: 'flex-end', padding: 10 },
});
