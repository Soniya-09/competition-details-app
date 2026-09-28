import { Pressable as RNPressable } from 'react-native';

export function Touchable({ style, disabled, hitSlop = 8, ...props }) {
  return (
    <RNPressable
      {...props}
      disabled={disabled}
      hitSlop={hitSlop}
      style={(state) => [typeof style === 'function' ? style(state) : style, state.pressed && !disabled && { opacity: 0.7 }]}
    />
  );
}
