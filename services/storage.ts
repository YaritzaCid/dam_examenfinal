import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BirdSighting } from '@/types/sighting';

const SIGHTINGS_STORAGE_KEY = '@avistaves/sightings';

function isWeatherSummary(value: unknown): value is BirdSighting['weather'] {
  if (value === undefined) {
    return true;
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const weather = value as Partial<NonNullable<BirdSighting['weather']>>;

  return (
    typeof weather.temperatureCelsius === 'number' &&
    Number.isFinite(weather.temperatureCelsius) &&
    typeof weather.relativeHumidity === 'number' &&
    Number.isFinite(weather.relativeHumidity) &&
    typeof weather.weatherCode === 'number' &&
    Number.isFinite(weather.weatherCode) &&
    typeof weather.condition === 'string' &&
    typeof weather.observedAt === 'string'
  );
}

function isBirdSighting(value: unknown): value is BirdSighting {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const sighting = value as Partial<BirdSighting>;

  return (
    typeof sighting.id === 'string' &&
    typeof sighting.photoUri === 'string' &&
    typeof sighting.latitude === 'number' &&
    Number.isFinite(sighting.latitude) &&
    typeof sighting.longitude === 'number' &&
    Number.isFinite(sighting.longitude) &&
    typeof sighting.birdName === 'string' &&
    typeof sighting.observedAt === 'string' &&
    typeof sighting.count === 'number' &&
    Number.isInteger(sighting.count) &&
    sighting.count >= 1 &&
    typeof sighting.notes === 'string' &&
    typeof sighting.createdAt === 'string' &&
    isWeatherSummary(sighting.weather)
  );
}

function parseSightings(rawValue: string | null): BirdSighting[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isBirdSighting);
  } catch {
    return [];
  }
}

export async function getAllSightings(): Promise<BirdSighting[]> {
  try {
    const rawSightings = await AsyncStorage.getItem(SIGHTINGS_STORAGE_KEY);

    return parseSightings(rawSightings);
  } catch {
    throw new Error('No se pudieron leer los avistamientos guardados.');
  }
}

export async function saveSighting(sighting: BirdSighting): Promise<BirdSighting> {
  try {
    const storedSightings = await getAllSightings();
    const nextSightings = [sighting, ...storedSightings.filter((item) => item.id !== sighting.id)];

    await AsyncStorage.setItem(SIGHTINGS_STORAGE_KEY, JSON.stringify(nextSightings));

    return sighting;
  } catch {
    throw new Error('No se pudo guardar el avistamiento. Intenta de nuevo.');
  }
}

export async function getSightingById(id: string): Promise<BirdSighting | null> {
  try {
    const storedSightings = await getAllSightings();

    return storedSightings.find((sighting) => sighting.id === id) ?? null;
  } catch {
    throw new Error('No se pudo leer el avistamiento guardado.');
  }
}
