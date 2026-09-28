import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

const PODIUM = {
  1: { name: 'trophy', color: colors.gold },
  2: { name: 'medal', color: colors.silver },
  3: { name: 'medal', color: colors.bronze },
};

export function RewardsList({ rewards }) {
  const { t, ordinalWinner } = useI18n();
  if (!rewards?.length) return null;
  return (
    <Card
      title={t('rewards')}
      titleAccessory={
        <AppText size={13} color={colors.textSecondary}>
          {t('allPositions')}
        </AppText>
      }
    >
      <View style={styles.list}>
        {rewards.map((r) => {
          const icon = PODIUM[r.position] ?? { name: 'star-outline', color: colors.primary };
          return (
            <View key={r.position} style={styles.row}>
              <Ionicons name={icon.name} size={20} color={icon.color} style={styles.icon} />
              <AppText size={14} weight="medium" style={styles.label}>
                {ordinalWinner(r.position)}
              </AppText>
              <AppText size={17} weight="bold" color={colors.primary}>
                {formatMoney(r.prize)}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFA',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  icon: { width: 30 },
  label: { flex: 1, marginLeft: spacing.sm },
});
