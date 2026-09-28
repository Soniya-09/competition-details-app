import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Touchable } from './Pressable';
import { colors, radius, spacing } from '../../theme';

export function ErrorState({ title, message, actionLabel, onAction, icon = 'cloud-offline-outline' }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <AppText weight="semibold" size={17} style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.textSecondary} style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {onAction ? (
        <Touchable onPress={onAction} style={styles.button} accessibilityRole="button">
          <AppText weight="semibold" color="#fff">
            {actionLabel}
          </AppText>
        </Touchable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  center: { textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 10, marginTop: spacing.sm },
});
