import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ProgressBar } from '../ui/ProgressBar';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

function StatusBadge({ registration }) {
  const { t } = useI18n();
  if (registration?.status === 'confirmed') {
    return (
      <View style={[styles.badge, styles.badgeOk]} accessibilityLabel={t('registered')}>
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        <AppText size={13} weight="medium" color={colors.primaryDark}>
          {t('registered')}
        </AppText>
      </View>
    );
  }
  if (registration?.status === 'pending_payment') {
    return (
      <View style={[styles.badge, styles.badgePending]}>
        <Ionicons name="time-outline" size={16} color={colors.warning} />
        <AppText size={12} weight="medium" color={colors.warning}>
          {t('paymentPending')}
        </AppText>
      </View>
    );
  }
  return null;
}

function Availability({ availability }) {
  const { t } = useI18n();
  const { spotsLeft, spotsTaken, capacity } = availability;
  const scarce = spotsLeft > 0 && spotsLeft <= Math.max(3, capacity * 0.25);
  let label;
  if (spotsLeft === 0) label = t('soldOut');
  else if (spotsLeft === 1) label = t('oneSpotLeft');
  else label = t('onlySpotsLeft', { n: spotsLeft });
  const tone = spotsLeft === 0 ? colors.danger : scarce ? colors.warning : colors.primary;

  return (
    <View style={styles.availability} accessibilityLiveRegion="polite">
      <View style={styles.inline}>
        <Ionicons name="people-outline" size={17} color={tone} />
        <AppText size={14} weight="medium" color={tone}>
          {label}
        </AppText>
      </View>
      <ProgressBar value={spotsTaken / capacity} color={spotsLeft === 0 ? colors.danger : colors.primary} style={styles.progress} />
      <AppText size={12} color={colors.textSecondary}>
        {t('booked', { taken: spotsTaken, capacity })}
      </AppText>
    </View>
  );
}

export function SummaryCard({ competition, registration }) {
  const { t } = useI18n();
  const { title, category, tags, awardsCertificate, prizePool, entryFee, availability } = competition;

  return (
    <Card>
      <View style={styles.titleRow}>
        <AppText weight="bold" size={20} style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        <StatusBadge registration={registration} />
      </View>

      <View style={styles.tags}>
        {[category, ...tags].map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
        {awardsCertificate ? (
          <View style={styles.inline}>
            <Ionicons name="trophy-outline" size={16} color={colors.primary} />
            <AppText size={13} weight="medium" color={colors.primary}>
              {t('winnersGetCertificate')}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <AppText size={13} color={colors.textSecondary}>
            {t('prizePool')}
          </AppText>
          <AppText size={28} weight="bold" color={colors.primary} style={styles.amount}>
            {formatMoney(prizePool)}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={13} color={colors.textSecondary}>
            {t('entryFee')}
          </AppText>
          <AppText size={24} weight="bold" style={styles.amount}>
            {entryFee.amount === 0 ? t('free') : formatMoney(entryFee)}
          </AppText>
        </View>
        <Availability availability={availability} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 5 },
  badgeOk: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#CFE7E4' },
  badgePending: { backgroundColor: colors.warningSoft },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stats: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.lg, gap: spacing.md },
  stat: { flexShrink: 0, marginRight: spacing.sm },
  amount: { marginTop: 2 },
  availability: { flex: 1, minWidth: 120, gap: 6, paddingBottom: 2 },
  progress: { marginTop: 4 },
});
