import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { VenueSummary } from '@/api/concerts';
import { colors, radius } from '@/theme/tokens';

export function VenueMap({ venue }: { venue: VenueSummary }) {
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(venue.name)},${venue.latitude},${venue.longitude}`;

  if (!appKey) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackTitle}>카카오맵에서 공연장 위치를 확인해요</Text>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(kakaoMapUrl)}>
          <Text style={styles.link}>카카오맵 열기 →</Text>
        </Pressable>
      </View>
    );
  }

  const html = `<!doctype html>
    <html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
    <style>html,body,#map{width:100%;height:100%;margin:0;padding:0}</style></head>
    <body><div id="map"></div>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false"></script>
    <script>kakao.maps.load(function(){
      var position=new kakao.maps.LatLng(${venue.latitude},${venue.longitude});
      var map=new kakao.maps.Map(document.getElementById('map'),{center:position,level:4});
      new kakao.maps.Marker({map:map,position:position,title:${JSON.stringify(venue.name)}});
    });</script></body></html>`;

  return (
    <View style={styles.container}>
      <WebView
        accessibilityLabel={`${venue.name} 카카오맵`}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://stage-pin.vercel.app' }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    height: 190,
    marginTop: 14,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    justifyContent: 'center',
  },
  fallbackTitle: {
    color: '#191919',
    fontSize: 14,
    fontWeight: '700',
  },
  link: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
