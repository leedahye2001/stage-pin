import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export function TabBarGlass() {
  // This is only the web/Android fallback; iOS uses the actual system tab bar.
  return <View pointerEvents="none" style={s.fallback}>
    <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
    <View style={s.surfaceLight} />
    <View style={s.innerRim} />
    <View style={s.topGlint} />
    <View style={s.bottomGlint} />
  </View>;
}

const s = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFill, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', backgroundColor: 'rgba(255,255,255,0.12)' },
  surfaceLight: { position: 'absolute', top: -35, left: -20, right: -20, height: 68, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '-4deg' }] },
  innerRim: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 29, borderWidth: 1, borderTopColor: '#FFFFFF', borderLeftColor: 'rgba(255,255,255,0.9)', borderRightColor: 'rgba(216,201,255,0.4)', borderBottomColor: 'rgba(189,168,236,0.25)' },
  topGlint: { position: 'absolute', top: 1, left: 30, right: '35%', height: 2, borderRadius: 2, backgroundColor: '#FFFFFF' },
  bottomGlint: { position: 'absolute', bottom: 1, left: '55%', right: 30, height: 1, backgroundColor: 'rgba(255,255,255,0.95)' },
});
