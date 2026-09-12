import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { BirdSighting } from '@/types/sighting';

type SightingCardProps = {
  sighting: BirdSighting;
};

const palette = {
  card: '#FBF7ED',
  ink: '#26324A',
  reed: '#5E7740',
  kingfisher: '#158C9D',
  line: '#BCD0C5',
  muted: '#67746E',
  lichen: '#D9E6CB',
} as const;

const typefaces = {
  display: 'sans-serif-condensed',
  body: 'serif',
  utility: 'monospace',
} as const;

export function SightingCard({ sighting }: SightingCardProps) {
  const weatherLabel = sighting.weather
    ? `${sighting.weather.temperatureCelsius.toFixed(1)} °C`
    : 'Sin clima';

  return (
    <View style={styles.card}>
      <Image source={{ uri: sighting.photoUri }} style={styles.thumbnail} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {sighting.birdName}
        </Text>
        <Text style={styles.date} numberOfLines={1}>
          {sighting.observedAt}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.count}>{sighting.count} ejemplar(es)</Text>
          <Text style={[styles.weather, !sighting.weather && styles.weatherMissing]}>{weatherLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  thumbnail: {
    backgroundColor: palette.lichen,
    borderRadius: 18,
    height: 82,
    width: 82,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 24,
    fontWeight: '800',
  },
  date: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  count: {
    backgroundColor: palette.lichen,
    borderRadius: 999,
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weather: {
    backgroundColor: '#E5F4F1',
    borderRadius: 999,
    color: palette.kingfisher,
    fontFamily: typefaces.utility,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weatherMissing: {
    backgroundColor: '#F4F1E4',
    color: palette.muted,
  },
});
