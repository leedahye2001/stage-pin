import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPracticeSeats, normalizePracticeCode, secondsRemaining, type PracticeSeat } from '@/lib/ticketing-practice';
import { colors, radius, spacing } from '@/theme/tokens';

type Step = 'ready' | 'countdown' | 'captcha' | 'seats' | 'confirm' | 'success' | 'expired';
const areas = ['FLOOR A', 'FLOOR B', 'FLOOR C', 'FLOOR D', '1층 1구역', '1층 2구역'];
const codes = ['STAGE7', 'PIN428', 'LIVE26', 'DOME52'];

export default function TicketingPracticeScreen() {
  const [step, setStep] = useState<Step>('ready');
  const [date, setDate] = useState('2026.12.05 (토) 18:00');
  const [countdown, setCountdown] = useState(3);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [started, setStarted] = useState(0);
  const [finished, setFinished] = useState(0);
  const [code, setCode] = useState('STAGE7');
  const [answer, setAnswer] = useState('');
  const [area, setArea] = useState(areas[0]);
  const [seats, setSeats] = useState<PracticeSeat[]>([]);
  const [selected, setSelected] = useState<PracticeSeat | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (step !== 'countdown') return;
    const timer = setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        const time = Date.now();
        setStarted(time); setNow(time); setDeadline(time + 120000); setStep('captcha');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (!['captcha', 'seats', 'confirm'].includes(step)) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (secondsRemaining(deadline, time) === 0) setStep('expired');
    }, 200);
    return () => clearInterval(timer);
  }, [deadline, step]);

  useEffect(() => {
    if (step !== 'seats') return;
    const timer = setInterval(() => setSeats((current) => {
      const candidates = current.filter((seat) => !seat.taken && seat.id !== selected?.id);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      return target ? current.map((seat) => seat.id === target.id ? { ...seat, taken: true } : seat) : current;
    }), 3000);
    return () => clearInterval(timer);
  }, [step, selected]);

  const start = () => {
    setCountdown(3); setCode(codes[Math.floor(Math.random() * codes.length)]);
    setAnswer(''); setMessage(''); setMistakes(0); setSelected(null);
    setArea(areas[0]); setSeats(createPracticeSeats()); setStep('countdown');
  };
  const verify = () => {
    if (Date.now() >= deadline) { setStep('expired'); return; }
    if (normalizePracticeCode(answer) !== code) {
      setMistakes((value) => value + 1); setMessage('문자를 다시 확인해 주세요.'); return;
    }
    setMessage(''); setStep('seats');
  };
  const confirm = () => {
    if (Date.now() >= deadline) { setStep('expired'); return; }
    if (!selected) return;
    setMessage(''); setStep('confirm');
  };
  const finish = () => {
    const time = Date.now();
    if (time >= deadline) { setStep('expired'); return; }
    setFinished(time); setStep('success');
  };
  const remaining = secondsRemaining(deadline, now);
  const active = ['captcha', 'seats', 'confirm'].includes(step);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topline}>
          <Text style={styles.eyebrow}>STAGEPIN TICKET LAB</Text>
          <Text style={styles.practiceBadge}>연습 전용</Text>
        </View>
        <Text style={styles.title}>내 자리, 이번엔 잡아보자!</Text>
        <Text style={styles.subtitle}>손에 익을 때까지 가볍게 연습해요.</Text>
        <View style={styles.platforms}>
          <View style={styles.platformSelected}><Text style={styles.platformLabel}>YES24 방식</Text></View>
          <View style={styles.platformSoon}><Text style={styles.muted}>NOL · 준비 중</Text></View>
        </View>
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" color={colors.primary} size={18} />
          <Text style={styles.noticeText}>독립적인 모의 연습입니다. 실제 예매·결제는 진행되지 않으며 좌석 배치와 절차는 단순화했습니다.</Text>
        </View>
        {active ? (
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>{step === 'captcha' ? '01 보안문자' : step === 'seats' ? '02 좌석 선택' : '03 최종 확인'}</Text>
            <Text accessibilityLiveRegion="none" style={[styles.timer, remaining < 20 && styles.timerUrgent]}>
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
            </Text>
          </View>
        ) : null}

        {step === 'ready' ? (
          <>
            <View style={styles.concert}>
              <View style={styles.poster}>
                <Ionicons name="ticket" size={38} color={colors.white} />
                <Text style={styles.posterTitle}>FIRST{`\n`}ROW{`\n`}CLUB ✦</Text>
                <Text style={styles.posterCaption}>STAGEPIN PRACTICE CONCERT</Text>
              </View>
              <View style={styles.concertCopy}>
                <Text style={styles.concertTitle}>FIRST ROW CLUB</Text>
                <Text style={styles.muted}>가상 연습 공연</Text>
                <Text style={styles.venue}>KSPO DOME</Text>
                <Text style={styles.muted}>올림픽공원 체조경기장</Text>
                <Text style={styles.price}>1인 1매 · 모의 좌석 선택</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>관람 회차 선택</Text>
              {['2026.12.05 (토) 18:00', '2026.12.06 (일) 17:00'].map((item) => (
                <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: date === item }}
                  onPress={() => setDate(item)} style={[styles.date, date === item && styles.dateSelected]}>
                  <Text style={styles.dateText}>{date === item ? '●' : '○'}  {item}</Text>
                </Pressable>
              ))}
              <Text style={styles.hint}>3초 카운트다운 후 시작 · 총 2분 · 보안문자 → 좌석 → 확인</Text>
            </View>
            <Action label="연습 예매 시작" onPress={start} />
          </>
        ) : step === 'countdown' ? (
          <View style={styles.result}>
            <Text style={styles.cardTitle}>곧 예매가 열려요</Text>
            <Text style={styles.countdown}>{countdown}</Text>
            <Text style={styles.muted}>심호흡 한 번, 준비됐죠?</Text>
          </View>
        ) : step === 'captcha' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>보안문자를 입력해 주세요</Text>
            <Text style={styles.hint}>대소문자는 구분하지 않아요. 연습용 문자입니다.</Text>
            <View style={styles.codeCard}><Text selectable={false} style={styles.code}>{code}</Text></View>
            <TextInput accessibilityLabel="연습용 보안문자" autoCapitalize="characters" autoCorrect={false} maxLength={12}
              value={answer} onChangeText={setAnswer} onSubmitEditing={verify} placeholder="위의 6자리 문자 입력"
              placeholderTextColor={colors.textMuted} style={styles.input} />
            {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
            <Action label="입력 완료 · 좌석 선택" onPress={verify} />
          </View>
        ) : step === 'seats' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>KSPO DOME · 구역 선택</Text>
              <View style={styles.arena}>
                <View style={styles.stage}><Text style={styles.stageText}>STAGE</Text></View>
                <View style={styles.areaGrid}>{areas.map((item) => (
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: area === item }}
                    key={item} onPress={() => { setArea(item); setSeats(createPracticeSeats()); setSelected(null); }}
                    style={[styles.area, area === item && styles.areaSelected]}>
                    <Text style={[styles.areaText, area === item && styles.areaTextSelected]}>{item}</Text>
                  </Pressable>
                ))}</View>
              </View>
              <Text style={styles.hint}>연습용 배치입니다. 실제 공연의 무대·구역·좌석 수와 다릅니다.</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.seatHeading}><Text style={styles.cardTitle}>{area}</Text>
                <Text style={styles.available}>{seats.filter((seat) => !seat.taken).length}석 남음</Text></View>
              <Text style={styles.hint}>무대 방향 ↑ · 연습 중 다른 관객이 좌석을 선점합니다.</Text>
              <View style={styles.legend}><Text style={styles.legendText}>🟪 선택 가능</Text><Text style={styles.legendText}>⬛ 선택한 좌석</Text><Text style={styles.legendText}>▫ 판매 완료</Text></View>
              {Array.from({ length: 6 }, (_, row) => (
                <View key={row} style={styles.seatRow}>
                  <Text style={styles.rowLabel}>{row + 1}열</Text>
                  {seats.slice(row * 8, row * 8 + 8).map((seat) => (
                    <Pressable key={seat.id} disabled={seat.taken} accessibilityRole="button"
                      accessibilityLabel={`${seat.row}열 ${seat.number}번 ${seat.taken ? '판매 완료' : '선택 가능'}`}
                      accessibilityState={{ disabled: seat.taken, selected: selected?.id === seat.id }}
                      onPress={() => setSelected(selected?.id === seat.id ? null : seat)}
                      style={[styles.seat, seat.taken && styles.seatTaken, selected?.id === seat.id && styles.seatSelected]}>
                      <Text style={styles.seatNumber}>{seat.taken ? '' : seat.number}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
              <Text style={styles.selection}>{selected ? `${area} · ${selected.row}열 ${selected.number}번` : '원하는 좌석 1개를 선택해 주세요'}</Text>
              <Action disabled={!selected} label="좌석 선택 완료" onPress={confirm} />
            </View>
          </>
        ) : step === 'confirm' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>마지막으로 좌석을 확인하세요</Text>
            <Text style={styles.concertTitle}>FIRST ROW CLUB</Text>
            <Text style={styles.muted}>{date}</Text>
            <Text style={styles.muted}>KSPO DOME · {area}</Text>
            <Text style={styles.selection}>{selected?.row}열 {selected?.number}번 · 1매</Text>
            <Text style={styles.hint}>결제 정보는 입력하지 않아요. 아래 버튼으로 연습이 완료됩니다.</Text>
            <Action label="모의 예매 완료" onPress={finish} />
            <Pressable onPress={() => setStep('seats')} style={styles.textButton}><Text style={styles.link}>좌석 다시 고르기</Text></Pressable>
          </View>
        ) : (
          <View style={styles.result}>
            <View style={styles.resultIcon}><Ionicons name={step === 'success' ? 'ticket' : 'timer-outline'} color={colors.primary} size={42} /></View>
            <Text style={styles.resultTitle}>{step === 'success' ? '내 자리 잡았다! ✦' : '아쉽지만, 시간 종료!'}</Text>
            {step === 'success' ? <>
              <Text style={styles.selection}>{area} · {selected?.row}열 {selected?.number}번</Text>
              <Text style={styles.record}>{((finished - started) / 1000).toFixed(1)}<Text style={styles.recordUnit}>초</Text></Text>
              <Text style={styles.muted}>전체 소요 시간 · 문자 입력 실수 {mistakes}회</Text>
            </> : <Text style={styles.muted}>보안문자부터 다시 도전해 보세요.</Text>}
            <Text style={styles.hint}>연습 결과이며 실제 티켓이 발급되지 않습니다.</Text>
            <Action label="한 번 더 연습하기" onPress={start} />
            <Pressable onPress={() => setStep('ready')} style={styles.textButton}><Text style={styles.link}>회차 다시 선택</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, disabled && styles.disabled]}>
    <Text style={styles.actionText}>{label}</Text><Ionicons name="arrow-forward" color={colors.white} size={17} />
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  practiceBadge: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, fontSize: 10, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: -8 },
  platforms: { flexDirection: 'row', gap: 8 },
  platformSelected: { backgroundColor: '#E1F5F0', borderColor: '#248C79', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  platformLabel: { color: '#147565', fontSize: 12, fontWeight: '900' },
  platformSoon: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  notice: { flexDirection: 'row', gap: 7, backgroundColor: colors.primarySoft, padding: 12, borderRadius: radius.md },
  noticeText: { flex: 1, fontSize: 10, color: colors.primary, lineHeight: 16 },
  concert: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  poster: { backgroundColor: '#293E3A', padding: 16, width: '42%', gap: 16 },
  posterTitle: { color: '#DDFB92', fontSize: 26, lineHeight: 28, fontWeight: '900' },
  posterCaption: { color: '#A0B7AE', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  concertCopy: { flex: 1, justifyContent: 'center', padding: 14, gap: 3 },
  concertTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  venue: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 12 },
  price: { color: colors.primary, fontWeight: '700', fontSize: 10, marginTop: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  date: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  dateSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dateText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  action: { backgroundColor: colors.primary, borderRadius: radius.pill, minHeight: 52, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
  actionText: { color: colors.white, fontWeight: '900', fontSize: 14 },
  disabled: { opacity: 0.4 },
  result: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24, alignItems: 'center', gap: 16, marginTop: 12 },
  countdown: { color: colors.primary, fontWeight: '900', fontSize: 96, paddingVertical: 24 },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  timerLabel: { fontWeight: '800', color: colors.primary, fontSize: 12 },
  timer: { fontVariant: ['tabular-nums'], color: colors.text, fontSize: 26, fontWeight: '900' },
  timerUrgent: { color: '#D94D68' },
  codeCard: { backgroundColor: '#EBF1E7', borderRadius: radius.md, padding: 24, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#C0D2B5' },
  code: { color: '#364A32', letterSpacing: 8, fontSize: 30, fontWeight: '900', transform: [{ rotate: '-3deg' }] },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text },
  error: { color: '#D94D68', fontSize: 12 },
  arena: { backgroundColor: '#F1F0F5', borderRadius: 100, borderWidth: 2, borderColor: '#E4E1EC', padding: 22, gap: 15 },
  stage: { backgroundColor: '#302B41', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 32 },
  stageText: { color: colors.white, letterSpacing: 4, fontSize: 10, fontWeight: '900' },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  area: { width: '45%', minHeight: 42, backgroundColor: colors.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  areaSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  areaText: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  areaTextSelected: { color: colors.white },
  seatHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  available: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  legend: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  legendText: { color: colors.textMuted, fontSize: 9 },
  seatRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  rowLabel: { color: colors.textMuted, fontSize: 9, width: 20 },
  seat: { flex: 1, minHeight: 32, borderRadius: 5, backgroundColor: '#9476F4', alignItems: 'center', justifyContent: 'center' },
  seatTaken: { backgroundColor: '#E9E6F0' },
  seatSelected: { backgroundColor: '#302B41', borderWidth: 2, borderColor: '#C6F28B' },
  seatNumber: { color: colors.white, fontSize: 9, fontWeight: '700' },
  selection: { color: colors.primary, fontWeight: '800', fontSize: 13, paddingVertical: 8 },
  textButton: { alignSelf: 'center', padding: 10 },
  link: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  resultIcon: { backgroundColor: colors.primarySoft, borderRadius: 32, height: 76, width: 76, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 23, fontWeight: '900', color: colors.text },
  record: { color: colors.primary, fontSize: 56, fontWeight: '900' },
  recordUnit: { fontSize: 18 },
});
