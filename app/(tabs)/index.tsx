import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SightingCard } from '@/components/sighting-card';
import { getAllSightings } from '@/services/storage';
import type { BirdSighting } from '@/types/sighting';

type SortMode = 'recent' | 'name';

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

function sightingTime(sighting: BirdSighting) {
  const createdAtTime = Date.parse(sighting.createdAt);

  return Number.isFinite(createdAtTime) ? createdAtTime : 0;
}

export default function SightingsScreen() {
  const [sightings, setSightings] = useState<BirdSighting[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSightings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const storedSightings = await getAllSightings();
      setSightings(storedSightings);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudieron leer los avistamientos guardados.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSightings();
    }, [loadSightings])
  );

  const sortedSightings = useMemo(() => {
    const nextSightings = [...sightings];

    if (sortMode === 'name') {
      return nextSightings.sort((left, right) =>
        left.birdName.localeCompare(right.birdName, 'es', { sensitivity: 'base' })
      );
    }

    return nextSightings.sort((left, right) => sightingTime(right) - sightingTime(left));
  }, [sightings, sortMode]);

  const hasSightings = sortedSightings.length > 0;

  return (
    <View style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyGlyph}>◌</Text>
              <Text style={styles.emptyTitle}>Sin avistamientos guardados</Text>
              <Text style={styles.emptyText}>
                Registra tu primer avistamiento para ver aquí la foto, ave, fecha y clima.
              </Text>
              <Link href="/register" asChild>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Registrar avistamiento</Text>
                </Pressable>
              </Link>
            </View>
          )
        }
        ListFooterComponent={<View style={styles.footerSpace} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>birdtacora</Text>
              <Text style={styles.title}>Avistamientos</Text>
              <Text style={styles.subtitle}>
                Registros persistidos en este dispositivo. Más reciente primero por defecto.
              </Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroPill}>{sightings.length} guardado(s)</Text>
                <Link href="/register" asChild>
                  <Pressable style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
                    <Text style={styles.heroButtonText}>Nuevo</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={styles.controlsCard}>
              <Text style={styles.sectionLabel}>Ordenar</Text>
              <View style={styles.sortRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortMode === 'recent' }}
                  onPress={() => setSortMode('recent')}
                  style={({ pressed }) => [
                    styles.sortChip,
                    sortMode === 'recent' && styles.sortChipSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.sortChipText,
                      sortMode === 'recent' && styles.sortChipTextSelected,
                    ]}>
                    Más recientes
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortMode === 'name' }}
                  onPress={() => setSortMode('name')}
                  style={({ pressed }) => [
                    styles.sortChip,
                    sortMode === 'name' && styles.sortChipSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.sortChipText,
                      sortMode === 'name' && styles.sortChipTextSelected,
                    ]}>
                    Nombre A-Z
                  </Text>
                </Pressable>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.statusCard}>
                <ActivityIndicator color={palette.kingfisher} size="small" />
                <Text style={styles.statusText}>Cargando avistamientos...</Text>
              </View>
            ) : null}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
        }
        contentContainerStyle={[styles.content, !hasSightings && styles.contentEmpty]}
        data={sortedSightings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/sighting/[id]', params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button">
              <SightingCard sighting={item} />
            </Pressable>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.shell,
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  header: {
    gap: 18,
    marginBottom: 18,
  },
  hero: {
    backgroundColor: palette.ink,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 28,
    paddingTop: 34,
  },
  eyebrow: {
    color: palette.mist,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.card,
    fontFamily: typefaces.display,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 48,
    marginTop: 10,
  },
  subtitle: {
    color: '#DCECE7',
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 22,
  },
  heroPill: {
    backgroundColor: 'rgba(184, 227, 224, 0.18)',
    borderColor: 'rgba(184, 227, 224, 0.38)',
    borderRadius: 999,
    borderWidth: 1,
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroButton: {
    backgroundColor: palette.berry,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 13,
    fontWeight: '900',
  },
  controlsCard: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionLabel: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#F4F1E4',
    borderColor: palette.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipSelected: {
    backgroundColor: palette.mist,
    borderColor: palette.kingfisher,
  },
  sortChipText: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 13,
    fontWeight: '800',
  },
  sortChipTextSelected: {
    color: palette.ink,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  statusText: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 14,
  },
  errorText: {
    backgroundColor: palette.errorBg,
    borderRadius: 14,
    color: palette.errorInk,
    fontFamily: typefaces.body,
    fontSize: 14,
    fontWeight: '700',
    padding: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
    padding: 24,
  },
  emptyGlyph: {
    color: palette.kingfisher,
    fontSize: 48,
    lineHeight: 54,
  },
  emptyTitle: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: palette.berry,
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: palette.card,
    fontFamily: typefaces.display,
    fontSize: 18,
    fontWeight: '900',
  },
  separator: {
    height: 12,
  },
  footerSpace: {
    height: 28,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
