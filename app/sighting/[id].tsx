import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WeatherIcon } from '@/components/weather-icon';
import { getSightingById } from '@/services/storage';
import type { BirdSighting } from '@/types/sighting';

const palette = {
  shell: '#EAF1EC',
  card: '#FBF7ED',
  ink: '#26324A',
  reed: '#5E7740',
  kingfisher: '#158C9D',
  mist: '#B8E3E0',
  berry: '#B2456E',
  lichen: '#D9E6CB',
  line: '#BCD0C5',
  muted: '#67746E',
  errorBg: '#F3D7D0',
  errorInk: '#8D2D3C',
} as const;

const typefaces = {
  display: 'sans-serif-condensed',
  body: 'serif',
  utility: 'monospace',
} as const;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function coordinateLabel(sighting: BirdSighting) {
  return `${sighting.latitude.toFixed(6)}, ${sighting.longitude.toFixed(6)}`;
}

function addressLabel(address: Location.LocationGeocodedAddress) {
  const parts = [
    address.name,
    address.street,
    address.district,
    address.city,
    address.region,
    address.country,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

  if (address.formattedAddress && address.formattedAddress.trim().length > 0) {
    return address.formattedAddress;
  }

  return parts.join(', ');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function SightingDetailScreen() {
  const params = useLocalSearchParams();
  const sightingId = firstParam(params.id);
  const [sighting, setSighting] = useState<BirdSighting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [address, setAddress] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSighting() {
      setIsLoading(true);
      setErrorMessage('');

      if (!sightingId) {
        setErrorMessage('Identificador de avistamiento inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const storedSighting = await getSightingById(sightingId);

        if (isActive) {
          setSighting(storedSighting);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No se pudo leer el avistamiento guardado.'
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSighting();

    return () => {
      isActive = false;
    };
  }, [sightingId]);

  useEffect(() => {
    let isActive = true;

    async function loadAddress(nextSighting: BirdSighting) {
      setAddress('');
      setAddressMessage('');
      setIsAddressLoading(true);

      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const finalPermission = permission.granted
          ? permission
          : await Location.requestForegroundPermissionsAsync();

        if (!finalPermission.granted) {
          setAddressMessage('Dirección no disponible por permiso de ubicación. Coordenadas aproximadas.');
          return;
        }

        const addresses = await Location.reverseGeocodeAsync({
          latitude: nextSighting.latitude,
          longitude: nextSighting.longitude,
        });
        const nextAddress = addresses[0] ? addressLabel(addresses[0]) : '';

        if (!nextAddress) {
          setAddressMessage('Dirección legible no disponible. Coordenadas aproximadas.');
          return;
        }

        if (isActive) {
          setAddress(nextAddress);
        }
      } catch {
        if (isActive) {
          setAddressMessage('No se pudo obtener dirección legible. Coordenadas aproximadas.');
        }
      } finally {
        if (isActive) {
          setIsAddressLoading(false);
        }
      }
    }

    if (sighting) {
      void loadAddress(sighting);
    }

    return () => {
      isActive = false;
    };
  }, [sighting]);

  const weatherSummary = useMemo(() => {
    if (!sighting?.weather) {
      return 'Sin clima registrado para este avistamiento.';
    }

    return `${sighting.weather.condition} · ${sighting.weather.temperatureCelsius.toFixed(1)} °C · Humedad ${sighting.weather.relativeHumidity}%`;
  }, [sighting]);

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <Stack.Screen options={{ title: 'Detalle' }} />
        <ActivityIndicator color={palette.kingfisher} size="large" />
        <Text style={styles.centerText}>Cargando avistamiento...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centerScreen}>
        <Stack.Screen options={{ title: 'Detalle' }} />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (!sighting) {
    return (
      <View style={styles.centerScreen}>
        <Stack.Screen options={{ title: 'Detalle' }} />
        <Text style={styles.emptyTitle}>Avistamiento no encontrado</Text>
        <Text style={styles.centerText}>El registro pudo ser eliminado o no está disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Stack.Screen options={{ title: sighting.birdName }} />
      <Image source={{ uri: sighting.photoUri }} style={styles.photo} contentFit="cover" />

      <View style={styles.card}>
        <Text style={styles.eyebrow}>Detalle de avistamiento</Text>
        <Text style={styles.title}>{sighting.birdName}</Text>
        <Text style={styles.subtitle}>{sighting.observedAt}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos</Text>
        <DetailRow label="Ejemplares" value={`${sighting.count}`} />
        <DetailRow label="Notas" value={sighting.notes || 'Sin notas'} />
        <DetailRow label="Creado" value={sighting.createdAt} />
        <DetailRow label="ID" value={sighting.id} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clima</Text>
        <Text style={styles.weatherText}>
          {sighting.weather ? (
            <>
              <WeatherIcon color={palette.kingfisher} size={20} weatherCode={sighting.weather.weatherCode} />
              {'  '}
            </>
          ) : null}
          {weatherSummary}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        {isAddressLoading ? (
          <View style={styles.inlineStatus}>
            <ActivityIndicator color={palette.kingfisher} size="small" />
            <Text style={styles.detailValue}>Obteniendo dirección...</Text>
          </View>
        ) : null}
        {address ? <Text style={styles.addressText}>{address}</Text> : null}
        {addressMessage ? <Text style={styles.helperText}>{addressMessage}</Text> : null}
        <DetailRow label="Referencia GPS" value={coordinateLabel(sighting)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.shell,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 48,
  },
  centerScreen: {
    alignItems: 'center',
    backgroundColor: palette.shell,
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  photo: {
    backgroundColor: palette.lichen,
    borderRadius: 30,
    height: 320,
    width: '100%',
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 26,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  eyebrow: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 42,
  },
  subtitle: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 26,
    fontWeight: '800',
  },
  detailRow: {
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10,
  },
  detailLabel: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: palette.ink,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
  },
  weatherText: {
    backgroundColor: '#E5F4F1',
    borderRadius: 18,
    color: palette.kingfisher,
    fontFamily: typefaces.utility,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    padding: 12,
  },
  addressText: {
    color: palette.ink,
    fontFamily: typefaces.body,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
  },
  helperText: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  inlineStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    backgroundColor: palette.errorBg,
    borderRadius: 14,
    color: palette.errorInk,
    fontFamily: typefaces.body,
    fontSize: 14,
    fontWeight: '700',
    padding: 12,
    textAlign: 'center',
  },
  emptyTitle: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
});
