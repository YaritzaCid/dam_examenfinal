import type { WeatherSummary } from '@/services/weather';

export type BirdSighting = {
  id: string;
  photoUri: string;
  latitude: number;
  longitude: number;
  birdName: string;
  observedAt: string;
  count: number;
  notes: string;
  weather?: WeatherSummary;
  createdAt: string;
};
