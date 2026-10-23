import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { type ComponentRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { colors, radius, spacing, typography } from '@/theme/tokens';

const emptyPhotos: (string | null)[] = [null, null, null, null];

export default function PinLogCreateScreen() {
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [photos, setPhotos] = useState(emptyPhotos);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [note, setNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const pickPhoto = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근이 필요해요', '설정에서 StagePin의 사진 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled) return;
    setPhotos((current) => current.map((photo, photoIndex) => (
      photoIndex === index ? result.assets[0].uri : photo
    )));
  };

  const exportPinLog = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.download = `stagepin-${Date.now()}.png`;
        link.href = uri;
        link.click();
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: '나의 StagePin 핀로그 공유하기',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('저장 완료', '핀로그 이미지가 기기에 저장되었어요.');
      }
    } catch {
      Alert.alert('이미지를 만들지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>STAGEPIN 4-CUT</Text>
          <Text style={styles.title}>공연 가는 날, 4컷으로 남겨요.</Text>
          <Text style={styles.description}>사진 네 장과 한 줄 감상을 넣으면 바로 공유할 수 있는 핀로그가 완성돼요.</Text>
        </View>

        <View collapsable={false} ref={cardRef} style={styles.pinLogCard}>
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <Pressable
                accessibilityLabel={`${index + 1}번째 공연 사진 선택`}
                key={index}
                onPress={() => pickPhoto(index)}
                style={styles.photoSlot}
              >
                {photo ? (
                  <Image accessibilityIgnoresInvertColors source={{ uri: photo }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons color={colors.primary} name="add" size={25} />
                    <Text style={styles.photoNumber}>{index + 1}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          <View style={styles.cardCopy}>
            <View style={styles.cardHeader}>
              <View style={styles.pinBadge}>
                <Ionicons color={colors.white} name="location" size={12} />
                <Text style={styles.pinBadgeText}>STAGEPIN</Text>
              </View>
              <Text style={styles.cardDate}>{new Intl.DateTimeFormat('ko-KR').format(new Date())}</Text>
            </View>
            <Text numberOfLines={1} style={styles.cardArtist}>{artist || 'MY FAVORITE ARTIST'}</Text>
            <Text numberOfLines={2} style={styles.cardTitle}>{title || '오늘의 공연 이름'}</Text>
            <Text numberOfLines={1} style={styles.cardVenue}>{venue || '공연장 이름'}</Text>
            <View style={styles.noteBubble}>
              <Text numberOfLines={2} style={styles.cardNote}>{note || '오늘의 무대를 한 줄로 기록해 보세요 ✦'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>핀로그 정보</Text>
          <Input label="아티스트" onChangeText={setArtist} placeholder="예: DAY6" value={artist} />
          <Input label="공연명" onChangeText={setTitle} placeholder="예: The Present" value={title} />
          <Input label="공연장" onChangeText={setVenue} placeholder="예: KSPO DOME" value={venue} />
          <Input
            label="한 줄 감상"
            maxLength={80}
            multiline
            onChangeText={setNote}
            placeholder="가장 기억나는 순간은?"
            value={note}
          />
        </View>

        <Pressable disabled={isExporting} onPress={exportPinLog} style={styles.exportButton}>
          {isExporting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons color={colors.white} name="share-social" size={19} />
              <Text style={styles.exportText}>이미지로 저장·공유</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.helper}>사진은 서버로 전송하지 않고 이 핀로그 이미지를 만드는 데만 사용해요.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type InputProps = {
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function Input({ label, ...props }: InputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, props.multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xl },
  intro: { gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  pinLogCard: { alignSelf: 'center', aspectRatio: 9 / 15, backgroundColor: '#1D1A24', borderRadius: 28, overflow: 'hidden', padding: 10, width: '100%' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, height: '58%' },
  photoSlot: { height: '49%', overflow: 'hidden', width: '49%' },
  photo: { height: '100%', width: '100%' },
  photoPlaceholder: { alignItems: 'center', backgroundColor: '#F0ECFF', height: '100%', justifyContent: 'center', width: '100%' },
  photoNumber: { color: colors.primary, fontSize: 10, fontWeight: '900', marginTop: 2 },
  cardCopy: { flex: 1, justifyContent: 'center', padding: spacing.md },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  pinBadge: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  pinBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardDate: { color: 'rgba(255,255,255,0.54)', fontSize: 9 },
  cardArtist: { color: '#B8A8FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: spacing.md },
  cardTitle: { color: colors.white, fontSize: 23, fontWeight: '900', lineHeight: 27, marginTop: 3 },
  cardVenue: { color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: 4 },
  noteBubble: { backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: radius.md, marginTop: spacing.md, padding: spacing.sm },
  cardNote: { color: colors.white, fontSize: 11, lineHeight: 16 },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  formTitle: { color: colors.text, fontSize: typography.title, fontWeight: '900' },
  inputGroup: { gap: spacing.xs },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, color: colors.text, fontSize: 14, minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: 12 },
  multilineInput: { minHeight: 82, textAlignVertical: 'top' },
  exportButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 },
  exportText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  helper: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
