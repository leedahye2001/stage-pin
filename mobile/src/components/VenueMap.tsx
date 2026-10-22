import { Platform, StyleSheet, View } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';

import type { VenueSummary } from '@/api/concerts';
import { radius } from '@/theme/tokens';

export function VenueMap({ venue }: { venue: VenueSummary }) {
  const cameraPosition = {
    coordinates: { latitude: venue.latitude, longitude: venue.longitude },
    zoom: 15,
  };
  const markers = [{
    id: venue.id,
    coordinates: cameraPosition.coordinates,
    title: venue.name,
    snippet: venue.address ?? venue.city,
    showCallout: true,
  }];

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <AppleMaps.View cameraPosition={cameraPosition} markers={markers} style={styles.map} />
      ) : (
        <GoogleMaps.View cameraPosition={cameraPosition} markers={markers} style={styles.map} />
      )}
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
});
