import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';

export function ReferralCard({ referral, competitionTitle, onRequireSignIn }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    if (!referral) return onRequireSignIn();
    await Clipboard.setStringAsync(referral.link);
    setCopied(true);
  };

  const share = async () => {
    if (!referral) return onRequireSignIn();
    await Share.share({ message: t('referMessage', { title: competitionTitle, link: referral.link }) });
  };

  return (
    <View style={styles.card}>
      <Ionicons name="megaphone-outline" size={40} color={colors.primary} style={styles.icon} />
      <View style={styles.left}>
        <AppText size={14} weight="semibold">
          {t('referEarn')}
        </AppText>
        <View style={styles.linkBox}>
          <AppText size={12} numberOfLines={1} style={styles.link} selectable>
            {referral?.link ?? t('signInToRefer')}
          </AppText>
          <Touchable onPress={copy} style={styles.copy} accessibilityRole="button">
            <AppText size={12} weight="semibold" color={colors.primary}>
              {copied ? t('copied') : t('copyLink')}
            </AppText>
          </Touchable>
        </View>
      </View>
      <View style={styles.right}>
        <Touchable onPress={share} style={styles.referBtn} accessibilityRole="button">
          <AppText size={13} weight="semibold" color="#fff">
            {t('referNow')}
          </AppText>
        </Touchable>
        {referral?.rewardPerSignup?.amount ? (
          <AppText size={11} color={colors.primaryDark} style={styles.center}>
            {t('youEarn', { amount: formatMoney(referral.rewardPerSignup) })}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  icon: { transform: [{ rotate: '-12deg' }] },
  left: { flex: 1, gap: 6 },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.sm,
  },
  link: { flex: 1, color: colors.textSecondary },
  copy: { borderLeftWidth: 1, borderLeftColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  right: { width: 118, alignItems: 'center', gap: 4 },
  referBtn: { backgroundColor: colors.primaryDark, borderRadius: radius.sm, paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center' },
  center: { textAlign: 'center' },
});
