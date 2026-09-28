import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, radius, shadow, spacing } from '../../theme';

export function TestimonialsLink({ onPress }) {
  const { t } = useI18n();
  return (
    <Touchable onPress={onPress} style={styles.testimonials} accessibilityRole="button">
      <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
      <View style={styles.flex}>
        <AppText size={14} weight="semibold">
          {t('hearFromUsers')}
        </AppText>
        <AppText size={11} color={colors.textSecondary}>
          {t('hearFromUsersSub')}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text} />
    </Touchable>
  );
}

export function AdSlot() {
  const { t } = useI18n();
  return (
    <View style={styles.ad} accessibilityLabel="Advertisement">
      <Ionicons name="megaphone-outline" size={18} color={colors.textMuted} />
      <AppText size={13} weight="medium" color={colors.textMuted}>
        {t('adHere')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  testimonials: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  ad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9D3D2',
    borderRadius: radius.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
});
