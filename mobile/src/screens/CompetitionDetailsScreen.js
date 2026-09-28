import { useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompetition } from '../hooks/useCompetition';
import { useCompetitionActions } from '../hooks/useCompetitionActions';
import { useAuth } from '../auth/AuthContext';
import { useI18n, useErrorMessage } from '../i18n/I18nContext';
import { notify } from '../lib/notify';
import { Header } from '../components/competition/Header';
import { SummaryCard } from '../components/competition/SummaryCard';
import { JudgeCard } from '../components/competition/JudgeCard';
import { CountdownBanner } from '../components/competition/CountdownBanner';
import { ImportantDates } from '../components/competition/ImportantDates';
import { PreviousWinners } from '../components/competition/PreviousWinners';
import { InfoTabs } from '../components/competition/InfoTabs';
import { RewardsList } from '../components/competition/RewardsList';
import { Disclaimer, TrustSection } from '../components/competition/TrustSection';
import { ReferralCard } from '../components/competition/ReferralCard';
import { AdSlot, TestimonialsLink } from '../components/competition/MiscSections';
import { PrimaryActionButton } from '../components/competition/PrimaryActionButton';
import { BottomTabBar } from '../components/BottomTabBar';
import { VideoModal } from '../components/VideoModal';
import { CheckoutSheet } from '../components/CheckoutSheet';
import { DetailsSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { colors, spacing } from '../theme';

function reconcileAction(action, availability) {
  if (!action) return null;
  if (action.type === 'REGISTER' && availability.spotsLeft === 0) return { type: 'SOLD_OUT', enabled: false, meta: {} };
  if (action.type === 'SOLD_OUT' && availability.spotsLeft > 0) return { type: 'REGISTER', enabled: true, meta: {} };
  return action;
}

export function CompetitionDetailsScreen({ route, navigation }) {
  const { slug } = route.params;
  const { t, ordinalWinner } = useI18n();
  const errorMessage = useErrorMessage();
  const { requestSignIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { competition, viewer, error, loading, refreshing, refresh, reload, setViewer } = useCompetition(slug);
  const actions = useCompetitionActions({ slug, competition, viewer, setViewer, reload });
  const [video, setVideo] = useState(null);

  const primaryAction = useMemo(
    () => competition && reconcileAction(viewer?.primaryAction, competition.availability),
    [competition, viewer?.primaryAction],
  );

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Competitions'));

  const onNavigate = (tab) => {
    if (tab === 'competitions') navigation.navigate('Competitions');
    else if (tab === 'profile') requestSignIn();
    else notify(t('comingSoon'), t('comingSoonBody'));
  };

  let body;
  if (loading) {
    body = <DetailsSkeleton />;
  } else if (!competition) {
    const notFound = error?.status === 404;
    body = (
      <ErrorState
        icon={notFound ? 'search-outline' : 'cloud-offline-outline'}
        title={notFound ? t('notFound') : t('loadFailed')}
        message={notFound ? null : error?.status === 0 ? t('offline') : errorMessage(error)}
        actionLabel={notFound ? t('competitions') : t('retry')}
        onAction={notFound ? () => navigation.navigate('Competitions') : reload}
      />
    );
  } else {
    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <SummaryCard competition={competition} registration={viewer?.registration} />
        <JudgeCard
          judge={competition.judge}
          onPlayIntro={() => setVideo({ uri: competition.judge.introVideoUrl, title: competition.judge.name })}
        />
        <CountdownBanner lifecycle={competition.lifecycle} availability={competition.availability} />
        <ImportantDates schedule={competition.schedule} />
        <PreviousWinners
          winners={competition.previousWinners}
          onPlay={(w) => setVideo({ uri: w.videoUrl, title: `${w.name} · ${ordinalWinner(w.position)}` })}
        />
        <InfoTabs about={competition.about} judgingParameters={competition.judgingParameters} rules={competition.rules} />
        <RewardsList rewards={competition.rewards} />
        <Disclaimer text={competition.disclaimer} />
        <TrustSection
          paymentProvider={competition.paymentProvider}
          onPlayPrizeVideo={() => setVideo({ uri: competition.prizeInfoVideoUrl, title: t('howReceivePrize') })}
          onOpenRefundPolicy={() => competition.refundPolicyUrl && Linking.openURL(competition.refundPolicyUrl)}
        />
        <ReferralCard referral={viewer?.referral} competitionTitle={competition.title} onRequireSignIn={requestSignIn} />
        <TestimonialsLink onPress={() => navigation.navigate('Testimonials')} />
        <AdSlot />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header onBack={goBack} />
      <View style={styles.flex}>{body}</View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {primaryAction ? (
          <View style={styles.cta}>
            <PrimaryActionButton
              action={primaryAction}
              entryFee={competition.entryFee}
              busyLabel={actions.busyLabel}
              onPress={() => actions.onPrimaryAction(primaryAction)}
            />
          </View>
        ) : null}
        <BottomTabBar active="competitions" onNavigate={onNavigate} />
      </View>

      <VideoModal video={video} onClose={() => setVideo(null)} />
      <CheckoutSheet
        visible={actions.checkoutOpen && viewer?.registration?.status === 'pending_payment'}
        registration={viewer?.registration}
        competitionTitle={competition?.title}
        paymentProvider={competition?.paymentProvider}
        busy={Boolean(actions.busy)}
        onPay={actions.pay}
        onPayLater={actions.closeCheckout}
        onRelease={actions.releaseSeat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.lg },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
