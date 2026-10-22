import { Platform, StyleSheet, View } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';

import type { Concert } from '@/api/concerts';
import { radius } from '@/theme/tokens';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
};

const cameraPosition = {
  coordinates: { latitude: 36.5, longitude: 127.8 },
  zoom: 4,
};

export function ConcertMap({ concerts, onSelect }: ConcertMapProps) {
  const venues = Array.from(
    new Map(concerts.map((concert) => [concert.venue.name, concert])).values(),
  );
  const markers = venues.map((concert) => ({
    id: concert.id,
    coordinates: {
      latitude: concert.venue.latitude,
      longitude: concert.venue.longitude,
    },
    title: concert.venue.name,
    snippet: concert.venue.city,
    showCallout: true,
  }));

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <AppleMaps.View
          cameraPosition={cameraPosition}
          markers={markers}
          onMarkerClick={(marker) => marker.id && onSelect(marker.id)}
          style={styles.map}
        />
      ) : (
        <GoogleMaps.View
          cameraPosition={cameraPosition}
          markers={markers}
          onMarkerClick={(marker) => marker.id && onSelect(marker.id)}
          style={styles.map}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    height: 300,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
