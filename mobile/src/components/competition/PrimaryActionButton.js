import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { useNow } from '../../hooks/useNow';
import { formatDateTime, formatMmSs, formatMoney } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

export function PrimaryActionButton({ action, entryFee, busyLabel, onPress }) {
  const { t, lang } = useI18n();
  const now = useNow();
  const { type, enabled, meta = {} } = action;

  const vars = {
    amount: entryFee?.amount ? formatMoney(entryFee) : t('free'),
    date: meta.at ? formatDateTime(meta.at, lang) : '',
    time: meta.holdExpiresAt ? formatMmSs(Date.parse(meta.holdExpiresAt) - now) : '',
  };
  const title = t(`action.${type}`);
  const subtitle = t(`action.${type}.sub`, vars);
  const busy = Boolean(busyLabel);

  return (
    <Touchable
      onPress={onPress}
      disabled={!enabled || busy}
      style={[styles.button, (!enabled || busy) && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled || busy, busy }}
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color="#fff" />
          <AppText weight="semibold" size={15} color="#fff">
            {busyLabel}
          </AppText>
        </View>
      ) : (
        <>
          <AppText weight="semibold" size={16} color="#fff">
            {title}
          </AppText>
          {subtitle ? (
            <AppText size={12} color="rgba(255,255,255,0.88)" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </>
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabled: { backgroundColor: colors.disabled },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
