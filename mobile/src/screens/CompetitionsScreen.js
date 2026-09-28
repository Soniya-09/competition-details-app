import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useErrorMessage, useI18n } from '../i18n/I18nContext';
import { formatMoney } from '../lib/format';
import { AppText } from '../components/ui/AppText';
import { Touchable } from '../components/ui/Pressable';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ErrorState } from '../components/ui/ErrorState';
import { LanguageToggle } from '../components/competition/Header';
import { colors, radius, shadow, spacing } from '../theme';

const PHASE_TONE = {
  REGISTRATION_OPEN: colors.primary,
  UPCOMING: colors.warning,
  SUBMISSION_OPEN: colors.primary,
  JUDGING: colors.textSecondary,
  RESULTS_ANNOUNCED: colors.textSecondary,
  REGISTRATION_CLOSED: colors.danger,
};

const PHASE_LABEL = {
  en: {
    UPCOMING: 'Upcoming',
    REGISTRATION_OPEN: 'Registration open',
    REGISTRATION_CLOSED: 'Registration closed',
    SUBMISSION_OPEN: 'Submissions open',
    JUDGING: 'Judging',
    RESULTS_ANNOUNCED: 'Results out',
    CANCELLED: 'Cancelled',
  },
  hi: {
    UPCOMING: 'आगामी',
    REGISTRATION_OPEN: 'पंजीकरण खुला',
    REGISTRATION_CLOSED: 'पंजीकरण बंद',
    SUBMISSION_OPEN: 'सबमिशन खुला',
    JUDGING: 'मूल्यांकन जारी',
    RESULTS_ANNOUNCED: 'परिणाम घोषित',
    CANCELLED: 'रद्द',
  },
};

export function CompetitionsScreen({ navigation }) {
  const { t, lang } = useI18n();
  const errorMessage = useErrorMessage();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.listCompetitions());
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, lang]);

  const renderItem = ({ item }) => {
    const { phase, flags } = item.lifecycle;
    const { spotsLeft, spotsTaken, capacity } = item.availability;
    return (
      <Touchable style={styles.card} onPress={() => navigation.push('CompetitionDetails', { slug: item.slug })}>
        <View style={styles.row}>
          <AppText weight="semibold" size={16} style={styles.flex}>
            {item.title}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
        <AppText size={12} weight="medium" color={PHASE_TONE[phase] ?? colors.textSecondary}>
          {PHASE_LABEL[lang][phase] ?? phase}
          {flags.isFull && flags.registrationOpen ? ` · ${t('soldOut')}` : ''}
        </AppText>
        <View style={[styles.row, styles.stats]}>
          <AppText size={13} color={colors.textSecondary}>
            {t('prizePool')}{' '}
            <AppText size={13} weight="semibold" color={colors.primary}>
              {formatMoney(item.prizePool)}
            </AppText>
          </AppText>
          <AppText size={13} color={colors.textSecondary}>
            {t('entryFee')}{' '}
            <AppText size={13} weight="semibold">
              {item.entryFee.amount ? formatMoney(item.entryFee) : t('free')}
            </AppText>
          </AppText>
        </View>
        <ProgressBar value={spotsTaken / capacity} color={spotsLeft === 0 ? colors.danger : colors.primary} />
        <AppText size={11} color={colors.textSecondary}>
          {t('booked', { taken: spotsTaken, capacity })}
        </AppText>
      </Touchable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <AppText weight="bold" size={22}>
          {t('competitions')}
        </AppText>
        <LanguageToggle />
      </View>
      {!items && !error ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      {!items && error ? <ErrorState title={t('loadFailed')} message={errorMessage(error)} actionLabel={t('retry')} onAction={load} /> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  loader: { marginTop: 40 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 6, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { marginVertical: 4 },
  flex: { flex: 1 },
});
