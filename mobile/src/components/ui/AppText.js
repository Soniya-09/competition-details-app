import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../theme';

const WEIGHTS = { regular: fonts.regular, medium: fonts.medium, semibold: fonts.semibold, bold: fonts.bold };

export function AppText({ weight = 'regular', size = 14, color = colors.text, style, ...props }) {
  return (
    <Text
      {...props}
      style={[styles.base, { fontFamily: WEIGHTS[weight], fontSize: size, lineHeight: Math.round(size * 1.45), color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
