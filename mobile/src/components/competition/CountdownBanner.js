import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { useI18n } from '../../i18n/I18nContext';
import { useNow } from '../../hooks/useNow';
import { formatCountdown } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

const URGENT_MS = 48 * 3600 * 1000;

export function CountdownBanner({ lifecycle, availability }) {
  const { t } = useI18n();
  const now = useNow();
  const milestone = lifecycle.nextMilestone;

  if (!milestone) {
    const label = lifecycle.phase === 'CANCELLED' ? t('competitionCancelled') : t('resultsOut');
    return (
      <View style={styles.banner}>
        <Ionicons name="ribbon-outline" size={22} color={colors.primary} />
        <AppText weight="semibold" size={14}>
          {label}
        </AppText>
      </View>
    );
  }

  const remaining = Date.parse(milestone.at) - now;
  const closingRegistration = milestone.type === 'REGISTRATION_CLOSES';
  const scarce = availability.spotsLeft > 0 && availability.spotsLeft <= Math.max(3, availability.capacity * 0.25);
  const urgent = closingRegistration && availability.spotsLeft > 0 && (remaining < URGENT_MS || scarce);

  return (
    <View style={styles.banner} accessibilityRole="timer">
      <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
      <AppText weight="semibold" size={14} style={styles.label} numberOfLines={2}>
        {t(`milestone.${milestone.type}`)}
      </AppText>
      <AppText
        weight="bold"
        size={16}
        color={colors.primary}
        style={styles.timer}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {formatCountdown(remaining)}
      </AppText>
      {urgent ? (
        <View style={styles.hurry}>
          <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
          <AppText weight="semibold" size={13} color={colors.primary}>
            {t('hurryUp')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  label: { flexShrink: 1, maxWidth: '38%' },
  timer: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] },
  hurry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
