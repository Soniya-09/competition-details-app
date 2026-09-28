import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, shadow, spacing } from '../../theme';

export function Card({ title, titleAccessory, style, children, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {title ? (
        <View style={styles.header}>
          <AppText weight="semibold" size={15}>
            {title}
          </AppText>
          {titleAccessory}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow,
  },
  padded: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md, gap: spacing.sm },
});
