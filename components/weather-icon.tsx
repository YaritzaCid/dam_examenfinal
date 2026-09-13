import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type WeatherIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type WeatherIconProps = {
  weatherCode: number;
  color: ComponentProps<typeof MaterialCommunityIcons>['color'];
  size?: number;
};

export function getWeatherIconName(weatherCode: number): WeatherIconName {
  if (weatherCode === 0) {
    return 'weather-sunny';
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return 'weather-partly-cloudy';
  }

  if (weatherCode === 3) {
    return 'weather-cloudy';
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return 'weather-fog';
  }

  if (weatherCode >= 51 && weatherCode <= 57) {
    return 'weather-rainy';
  }

  if ((weatherCode >= 61 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return 'weather-pouring';
  }

  if (weatherCode >= 71 && weatherCode <= 77) {
    return 'weather-snowy';
  }

  if (weatherCode >= 85 && weatherCode <= 86) {
    return 'weather-snowy-heavy';
  }

  if (weatherCode >= 95 && weatherCode <= 99) {
    return 'weather-lightning-rainy';
  }

  return 'weather-cloudy-alert';
}

export function WeatherIcon({ weatherCode, color, size = 24 }: WeatherIconProps) {
  return (
    <MaterialCommunityIcons
      accessible={false}
      color={color}
      name={getWeatherIconName(weatherCode)}
      size={size}
    />
  );
}
