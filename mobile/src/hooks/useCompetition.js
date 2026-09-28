import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { subscribeToAvailability } from '../realtime/socket';
import { serverNow } from '../lib/serverClock';

const MAX_TIMEOUT = 2 ** 31 - 1;

export function useCompetition(slug) {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const [details, viewerState] = await Promise.all([api.competition(slug), api.viewer(slug)]);
      if (requestId !== latestRequest.current) return;
      setCompetition(details);
      setViewer(viewerState);
      setError(null);
    } catch (err) {
      if (requestId === latestRequest.current) setError(err);
    }
    // `lang` and `user` change the payload, so they must re-trigger loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, lang, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Live availability pushed by the server when anyone registers or a hold expires.
  const competitionId = competition?.id;
  useEffect(() => {
    if (!competitionId) return undefined;
    return subscribeToAvailability(competitionId, ({ capacity, spotsTaken, spotsLeft }) =>
      setCompetition((c) =>
        c && {
          ...c,
          availability: { capacity, spotsTaken, spotsLeft },
          lifecycle: { ...c.lifecycle, flags: { ...c.lifecycle.flags, isFull: spotsLeft === 0 } },
        },
      ),
    );
  }, [competitionId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state === 'active' && load());
    return () => sub.remove();
  }, [load]);

  // Schedule a refetch for the next time-based state change.
  const nextMilestoneAt = competition?.lifecycle?.nextMilestone?.at;
  const holdExpiresAt = viewer?.registration?.status === 'pending_payment' ? viewer.registration.holdExpiresAt : null;
  useEffect(() => {
    const deadlines = [nextMilestoneAt, holdExpiresAt]
      .filter(Boolean)
      .map((iso) => Date.parse(iso) - serverNow())
      .filter((ms) => ms > 0 && ms < MAX_TIMEOUT);
    if (!deadlines.length) return undefined;
    const timer = setTimeout(load, Math.min(...deadlines) + 500);
    return () => clearTimeout(timer);
  }, [nextMilestoneAt, holdExpiresAt, load]);

  return {
    competition,
    viewer,
    error,
    loading: !competition && !error,
    refreshing,
    refresh,
    reload: load,
    setViewer,
  };
}
