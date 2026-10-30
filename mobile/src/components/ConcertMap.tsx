import { Platform, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { AppleMaps, GoogleMaps } from 'expo-maps';

import type { Concert } from '@/api/concerts';
import { radius } from '@/theme/tokens';
import type { MapLocation } from '@/lib/current-location';
import { mapVenues } from '@/lib/map-venues';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
  initialRealMap?: boolean;
  height?: number;
  autoLocate?: boolean;
  selectedConcertId?: string;
  venueCounts?: Record<string, number>;
  onLocationChange?: (location: MapLocation) => void;
  hideFootprintToggle?: boolean;
};

const cameraPosition = {
  coordinates: { latitude: 36.5, longitude: 127.8 },
  zoom: 4,
};

export function ConcertMap({ concerts, onSelect, height = 300, selectedConcertId, hideFootprintToggle }: ConcertMapProps) {
  const appleRef = useRef<AppleMaps.MapView>(null);
  const googleRef = useRef<GoogleMaps.MapView>(null);
  const venues = mapVenues(concerts).map(group => group.concerts[0]);
  const selected = venues.find(concert => concert.id === selectedConcertId);
  const camera = selected ? { coordinates: { latitude: selected.venue.latitude, longitude: selected.venue.longitude }, zoom: 14 } : cameraPosition;
  const latitude = selected?.venue.latitude, longitude = selected?.venue.longitude;
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const target = { coordinates: { latitude, longitude }, zoom: 14 };
    void (Platform.OS === 'ios' ? appleRef.current?.setCameraPosition(target) : googleRef.current?.setCameraPosition(target))?.catch(() => {});
  }, [latitude, longitude]);
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
    <View style={[styles.container, { height }, hideFootprintToggle && { borderRadius: 0 }]}>
      {Platform.OS === 'ios' ? (
        <AppleMaps.View
          ref={appleRef}
          cameraPosition={camera}
          markers={markers}
          onMarkerClick={(marker) => marker.id && onSelect(marker.id)}
          style={styles.map}
        />
      ) : (
        <GoogleMaps.View
          ref={googleRef}
          cameraPosition={camera}
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
