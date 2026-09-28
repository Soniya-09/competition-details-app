import { StyleSheet, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { useI18n } from '../../i18n/I18nContext';
import { useNow } from '../../hooks/useNow';
import { formatDay, formatTime } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

const ITEMS = [
  { key: 'registrationClosesAt', label: 'registerBefore', icon: <Ionicons name="calendar-outline" size={24} color={colors.primary} /> },
  { key: 'submissionStartsAt', label: 'submissionStarts', icon: <Feather name="send" size={22} color={colors.primary} /> },
  { key: 'submissionEndsAt', label: 'submissionEnds', icon: <Feather name="upload" size={22} color={colors.primary} /> },
  { key: 'resultAt', label: 'resultDate', icon: <Ionicons name="trophy-outline" size={24} color={colors.primary} /> },
];

function DateTile({ icon, label, iso, lang, passed, style }) {
  return (
    <View style={[styles.tile, style]}>
      <View style={[styles.icon, passed && styles.passed]}>{icon}</View>
      <View>
        <AppText size={12} color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText size={14} weight="semibold" color={colors.primary}>
          {formatDay(iso, lang)}
        </AppText>
        <AppText size={13} weight="medium">
          {formatTime(iso)}
        </AppText>
      </View>
    </View>
  );
}

export function ImportantDates({ schedule }) {
  const { t, lang } = useI18n();
  const now = useNow(30_000); // dims milestones that have passed
  return (
    <Card title={t('importantDates')}>
      <View style={styles.grid}>
        {ITEMS.map((item, i) => (
          <DateTile
            key={item.key}
            icon={item.icon}
            label={t(item.label)}
            iso={schedule[item.key]}
            lang={lang}
            passed={Date.parse(schedule[item.key]) <= now}
            style={[i % 2 === 0 && styles.leftCol, i < 2 && styles.topRow]}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  tile: { width: '50%', flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, paddingLeft: spacing.lg },
  leftCol: { borderRightWidth: 1, borderRightColor: colors.border },
  topRow: { borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 28, alignItems: 'center', paddingTop: 6 },
  passed: { opacity: 0.45 },
});
