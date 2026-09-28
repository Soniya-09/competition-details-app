import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useErrorMessage, useI18n } from '../i18n/I18nContext';
import { formatDateTime } from '../lib/format';
import { notify } from '../lib/notify';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // mirrors backend MAX_UPLOAD_MB

const STALE_STATE_ERRORS = new Set([
  'SOLD_OUT',
  'REGISTRATION_CLOSED',
  'REGISTRATION_NOT_OPEN',
  'HOLD_EXPIRED',
  'SUBMISSION_CLOSED',
  'SUBMISSION_NOT_STARTED',
  'NOT_REGISTERED',
]);

export function useCompetitionActions({ slug, competition, viewer, setViewer, reload }) {
  const { t, lang } = useI18n();
  const errorMessage = useErrorMessage();
  const { user, requestSignIn } = useAuth();
  const [busy, setBusy] = useState(null); // null | 'processing' | 'paying' | 'uploading'
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fail = useCallback(
    (err) => {
      notify(t('somethingWrong'), errorMessage(err));
      if (err?.code === 'UNAUTHORIZED') requestSignIn();
      if (STALE_STATE_ERRORS.has(err?.code)) reload();
    },
    [t, errorMessage, requestSignIn, reload],
  );

  const run = useCallback(
    async (label, fn) => {
      setBusy(label);
      try {
        return await fn();
      } catch (err) {
        fail(err);
        return undefined;
      } finally {
        setBusy(null);
      }
    },
    [fail],
  );

  const register = () =>
    run('processing', async () => {
      const { registration, viewer: next } = await api.register(slug);
      setViewer(next);
      if (registration.status === 'pending_payment') setCheckoutOpen(true);
      else notify(t('paymentSuccess'), t('paymentSuccessBody', { date: formatDateTime(competition.schedule.submissionEndsAt, lang) }));
    });

  const pay = () =>
    run('paying', async () => {
      const registrationId = viewer.registration.id;
      try {
        // In production this is the provider SDK's checkout returning a signed payload.
        const payment = await api.simulateCheckout(registrationId);
        const { viewer: next } = await api.confirmPayment(registrationId, payment);
        setViewer(next);
        setCheckoutOpen(false);
        notify(t('paymentSuccess'), t('paymentSuccessBody', { date: formatDateTime(competition.schedule.submissionEndsAt, lang) }));
      } catch (err) {
        if (err.code === 'HOLD_EXPIRED') setCheckoutOpen(false);
        throw err;
      }
    });

  const releaseSeat = () =>
    run('processing', async () => {
      const { viewer: next } = await api.cancelRegistration(viewer.registration.id);
      setViewer(next);
      setCheckoutOpen(false);
    });

  const upload = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];
    if (asset.size && asset.size > MAX_UPLOAD_BYTES) return fail({ code: 'LIMIT_FILE_SIZE' });
    if (asset.mimeType && !asset.mimeType.startsWith('video/')) return fail({ message: 'Please choose a video file.' });

    const form = new FormData();
    if (Platform.OS === 'web' && asset.file) form.append('file', asset.file, asset.name);
    else form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'video/mp4' });

    await run('uploading', async () => {
      const { viewer: next } = await api.uploadSubmission(slug, form);
      setViewer(next);
      notify(t('uploadSuccess'), t('uploadSuccessBody', { name: asset.name, date: formatDateTime(competition.schedule.submissionEndsAt, lang) }));
    });
  };

  const onPrimaryAction = (action) => {
    if (!user && action.type === 'REGISTER') return requestSignIn();
    switch (action.type) {
      case 'REGISTER':
        return register();
      case 'COMPLETE_PAYMENT':
        return setCheckoutOpen(true);
      case 'UPLOAD_SUBMISSION':
      case 'UPDATE_SUBMISSION':
        return upload();
      case 'VIEW_RESULTS':
        return notify(t('resultsTitle'), t('resultsBody'));
      default:
        return undefined;
    }
  };

  return {
    busy,
    busyLabel: busy === 'uploading' ? t('uploading') : busy ? t('processing') : null,
    checkoutOpen,
    closeCheckout: () => setCheckoutOpen(false),
    onPrimaryAction,
    pay,
    releaseSeat,
  };
}
