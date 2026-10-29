import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { responsiveLayout } from '@/lib/responsive';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  // Preserve the existing native app; these breakpoints adapt the web viewport.
  return responsiveLayout(Platform.OS === 'web' ? width : 0);
}

export const responsiveStyles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 32, gap: 32 },
  reading: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: 32 },
  form: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 32 },
});
