const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_WEATHER_TIMEOUT_MS = 6000;
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = new Map<string, { expiresAt: number; summary: WeatherSummary }>();

export type OpenMeteoCurrentWeather = {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
};

export type OpenMeteoCurrentUnits = {
  time: string;
  interval: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  weather_code: string;
};

export type OpenMeteoForecastResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: OpenMeteoCurrentUnits;
  current: OpenMeteoCurrentWeather;
};

export type WeatherSummary = {
  temperatureCelsius: number;
  relativeHumidity: number;
  weatherCode: number;
  condition: string;
  observedAt: string;
};

type FetchWeatherOptions = {
  timeoutMs?: number;
};


function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOpenMeteoForecastResponse(value: unknown): value is OpenMeteoForecastResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Partial<OpenMeteoForecastResponse>;

  if (
    typeof response.current !== 'object' ||
    response.current === null ||
    typeof response.current_units !== 'object' ||
    response.current_units === null
  ) {
    return false;
  }

  const current = response.current;
  const currentUnits = response.current_units;
  return (
    isNumber(response.latitude) &&
    isNumber(response.longitude) &&
    isNumber(response.generationtime_ms) &&
    isNumber(response.utc_offset_seconds) &&
    typeof response.timezone === 'string' &&
    typeof response.timezone_abbreviation === 'string' &&
    isNumber(response.elevation) &&
    typeof current.time === 'string' &&
    isNumber(current.interval) &&
    isNumber(current.temperature_2m) &&
    isNumber(current.relative_humidity_2m) &&
    isNumber(current.weather_code) &&
    typeof currentUnits.time === 'string' &&
    typeof currentUnits.interval === 'string' &&
    typeof currentUnits.temperature_2m === 'string' &&
    typeof currentUnits.relative_humidity_2m === 'string' &&
    typeof currentUnits.weather_code === 'string'
  );
}

export function translateWeatherCode(code: number): string {
  if (code === 0) {
    return 'despejado';
  }

  if (code === 1) {
    return 'mayormente despejado';
  }

  if (code === 2) {
    return 'parcialmente nublado';
  }

  if (code === 3) {
    return 'nublado';
  }

  if (code === 45 || code === 48) {
    return 'niebla';
  }

  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'lluvia';
  }

  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return 'nieve';
  }

  if (code >= 95 && code <= 99) {
    return 'tormenta';
  }

  return 'condición no identificada';
}

export async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  options: FetchWeatherOptions = {}
): Promise<WeatherSummary> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Coordenadas inválidas para consultar clima.');
  }

  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cachedWeather = weatherCache.get(cacheKey);

  if (cachedWeather && cachedWeather.expiresAt > Date.now()) {
    return cachedWeather.summary;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_WEATHER_TIMEOUT_MS
  );

  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    if (!response.ok) {
      throw new Error('Open-Meteo no respondió correctamente.');
    }

    const data: unknown = await response.json();

    if (!isOpenMeteoForecastResponse(data)) {
      throw new Error('Open-Meteo devolvió datos incompletos.');
    }

    const summary = {
      temperatureCelsius: data.current.temperature_2m,
      relativeHumidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      condition: translateWeatherCode(data.current.weather_code),
      observedAt: data.current.time,
    };

    weatherCache.set(cacheKey, {
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      summary,
    });

    return summary;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La consulta de clima tardó demasiado. Intenta de nuevo actualizando GPS.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
