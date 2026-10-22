import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { StyleSheet, View } from 'react-native';

import type { VenueSummary } from '@/api/concerts';
import { colors, radius } from '@/theme/tokens';

import 'leaflet/dist/leaflet.css';

export function VenueMap({ venue }: { venue: VenueSummary }) {
  const center: [number, number] = [venue.latitude, venue.longitude];

  return (
    <View style={styles.container}>
      <MapContainer
        attributionControl
        center={center}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        zoom={15}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          pathOptions={{ color: colors.white, fillColor: colors.primary, fillOpacity: 1, weight: 3 }}
          radius={10}
        >
          <Tooltip direction="top" offset={[0, -9]} permanent>{venue.name}</Tooltip>
        </CircleMarker>
      </MapContainer>
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
});
