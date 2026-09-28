import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './ui/BottomSheet';
import { AppText } from './ui/AppText';
import { Touchable } from './ui/Pressable';
import { useI18n } from '../i18n/I18nContext';
import { useNow } from '../hooks/useNow';
import { formatMmSs, formatMoney } from '../lib/format';
import { colors, radius, spacing } from '../theme';

export function CheckoutSheet({ visible, registration, competitionTitle, paymentProvider, busy, onPay, onPayLater, onRelease }) {
  const { t } = useI18n();
  const now = useNow();
  if (!registration) return null;

  const remaining = Date.parse(registration.holdExpiresAt) - now;
  const expired = remaining <= 0;

  return (
    <BottomSheet visible={visible} onClose={onPayLater}>
      <AppText weight="bold" size={18}>
        {t('checkoutTitle')}
      </AppText>
      <AppText color={colors.textSecondary}>{t('checkoutSubtitle')}</AppText>

      <View style={styles.summary}>
        <View style={styles.flex}>
          <AppText weight="semibold">{competitionTitle}</AppText>
          <AppText size={12} color={colors.textSecondary}>
            {paymentProvider}
          </AppText>
        </View>
        <AppText weight="bold" size={20} color={colors.primary}>
          {formatMoney(registration.amount)}
        </AppText>
      </View>

      <View style={[styles.hold, expired && styles.holdExpired]}>
        <Ionicons name="time-outline" size={18} color={expired ? colors.danger : colors.warning} />
        <AppText size={13} weight="medium" color={expired ? colors.danger : colors.warning}>
          {expired ? t('error.HOLD_EXPIRED') : `${t('seatHeldFor')} ${formatMmSs(remaining)}`}
        </AppText>
      </View>

      <Touchable onPress={onPay} disabled={busy || expired} style={[styles.pay, (busy || expired) && styles.payDisabled]} accessibilityRole="button">
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText weight="semibold" size={16} color="#fff">
            {t('payAmount', { amount: formatMoney(registration.amount) })}
          </AppText>
        )}
      </Touchable>

      <View style={styles.secondaryRow}>
        <Touchable onPress={onRelease} disabled={busy} accessibilityRole="button">
          <AppText size={13} weight="medium" color={colors.danger}>
            {t('releaseSeat')}
          </AppText>
        </Touchable>
        <Touchable onPress={onPayLater} disabled={busy} accessibilityRole="button">
          <AppText size={13} weight="medium" color={colors.textSecondary}>
            {t('payLater')}
          </AppText>
        </Touchable>
      </View>

      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
        <AppText size={11} color={colors.textMuted}>
          {t('mockGatewayNote')}
        </AppText>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  hold: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.warningSoft, borderRadius: radius.sm, padding: spacing.sm },
  holdExpired: { backgroundColor: colors.dangerSoft },
  pay: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  payDisabled: { backgroundColor: colors.disabled },
  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
