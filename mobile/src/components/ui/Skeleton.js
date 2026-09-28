import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

function Block({ height, width = '100%', style }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.block, { height, width, opacity }, style]} />;
}

export function DetailsSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading competition">
      <Block height={150} />
      <Block height={110} />
      <Block height={48} />
      <Block height={170} />
      <Block height={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.md },
  block: { backgroundColor: colors.divider, borderRadius: radius.lg },
});
