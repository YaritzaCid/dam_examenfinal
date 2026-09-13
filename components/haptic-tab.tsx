import type { ComponentProps } from 'react';
import { PlatformPressable } from 'expo-router/react-navigation';
import * as Haptics from 'expo-haptics';

function getPressColor(props: unknown) {
  if (props && typeof props === 'object' && 'pressColor' in props) {
    return typeof props.pressColor === 'string' ? props.pressColor : undefined;
  }

  return undefined;
}

export function HapticTab(props: unknown) {
  const platformProps = props as ComponentProps<typeof PlatformPressable>;
  const pressColor = getPressColor(props);

  return (
    <PlatformPressable
      {...platformProps}
      pressColor={typeof pressColor === 'string' ? pressColor : undefined}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        platformProps.onPressIn?.(ev);
      }}
    />
  );
}
