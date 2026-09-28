import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

export function ProgressBar({ value, color = colors.primary, style }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
