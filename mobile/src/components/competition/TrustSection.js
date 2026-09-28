import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, radius, shadow, spacing } from '../../theme';

export function Disclaimer({ text }) {
  const { t } = useI18n();
  if (!text) return null;
  return (
    <View style={styles.disclaimer}>
      <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
      <AppText size={13} style={styles.flex}>
        <AppText size={13} weight="semibold" color={colors.primary}>
          {t('disclaimer')}{' '}
        </AppText>
        {text}
      </AppText>
    </View>
  );
}

export function TrustSection({ onPlayPrizeVideo, onOpenRefundPolicy, paymentProvider }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Touchable onPress={onPlayPrizeVideo} style={[styles.box, styles.videoBox]} accessibilityRole="button">
        <View style={styles.videoIcon}>
          <Ionicons name="play-circle" size={30} color={colors.primaryDark} />
        </View>
        <View style={styles.flex}>
          <AppText size={13} weight="semibold">
            {t('howReceivePrize')}
          </AppText>
          <AppText size={11} color={colors.textSecondary}>
            {t('watchVideo')}
          </AppText>
        </View>
      </Touchable>

      <View style={[styles.box, styles.trustBox]}>
        <Touchable onPress={onOpenRefundPolicy} style={styles.trustLine} accessibilityRole="link">
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
          <AppText size={12} style={styles.underline}>
            {t('refundPolicy')}
          </AppText>
        </Touchable>
        <View style={styles.trustLine}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
          <AppText size={11} style={styles.flex}>
            {t('securePayments')}{' '}
            <AppText size={13} weight="bold" color="#072654" style={styles.brand}>
              {paymentProvider}
            </AppText>
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadow },
  videoBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  videoIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  trustBox: { flex: 1.15, justifyContent: 'center', gap: spacing.sm },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  underline: { textDecorationLine: 'underline' },
  brand: { fontStyle: 'italic' },
});
