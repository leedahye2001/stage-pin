import { type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Kept at the root so tab navigation and foregrounding never replay the intro. */
export function LaunchIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));
  const [wave] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    let pop: Animated.CompositeAnimation | undefined;
    let pulse: Animated.CompositeAnimation | undefined;
    const fade = Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true });
    // The deadline is independent of assets, network requests, and animation completion.
    const fadeTimer = setTimeout(() => fade.start(), 2700);
    const endTimer = setTimeout(() => {
      cancelled = true;
      pop?.stop();
      pulse?.stop();
      fade.stop();
      setVisible(false);
    }, 3000);
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      scale.setValue(0.8);
      pop = Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 450, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]);
      pulse = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 1400, useNativeDriver: true }));
      pop.start();
      pulse.start();
    }).catch(() => { /* Keep the static logo if motion preference cannot be read. */ });
    return () => {
      cancelled = true;
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      pop?.stop();
      pulse?.stop();
      fade.stop();
    };
  }, [opacity, scale, wave]);

  return <View style={s.root}>
    <View style={s.root} accessibilityElementsHidden={visible} importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {visible ? <Animated.View testID="launch-intro" accessibilityViewIsModal accessibilityLabel="StagePin 시작 화면" style={[s.overlay, { opacity }]}>
      <View style={s.art}>
        <Animated.View accessible={false} style={[s.wave, { opacity: wave.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] }) }] }]} />
        <View style={s.halo} />
        <Animated.View style={{ transform: [{ scale }] }}><Image accessibilityLabel="StagePin 로고" source={require('../../assets/stagepin-mark.png')} style={s.logo} resizeMode="contain" /></Animated.View>
      </View>
      <Text style={s.name}>stagepin<Text style={s.period}>.</Text></Text>
      <Text style={s.tagline}>좋아하는 무대, 연결되는 취향</Text>
      <Text style={s.caption}>YOUR NEXT STAGE STARTS HERE</Text>
    </Animated.View> : null}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  art: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 2, borderColor: '#BAA5F6' },
  halo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#EDE5FF' },
  logo: { width: 190, height: 190 },
  name: { fontSize: 40, fontWeight: '900', letterSpacing: -2, color: colors.text },
  period: { color: colors.primary },
  tagline: { color: '#76668A', marginTop: 12, fontSize: 14, fontWeight: '600' },
  caption: { color: '#A18CB9', fontSize: 9, letterSpacing: 2, marginTop: 40 },
});
