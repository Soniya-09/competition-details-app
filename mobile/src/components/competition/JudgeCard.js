import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, spacing } from '../../theme';

export function JudgeCard({ judge, onPlayIntro }) {
  const { t } = useI18n();
  return (
    <Card style={styles.card}>
      <Image source={{ uri: judge.photoUrl }} style={styles.photo} accessibilityIgnoresInvertColors />
      <View style={styles.info}>
        <AppText size={12} color={colors.textSecondary}>
          {t('judge')}
        </AppText>
        <AppText size={17} weight="semibold">
          {judge.name}
        </AppText>
        <AppText size={13} color={colors.textSecondary}>
          {judge.title}
        </AppText>
        {judge.experienceYears != null ? (
          <AppText size={12} color={colors.textSecondary}>
            {t('yearsExperience', { n: judge.experienceYears })}
          </AppText>
        ) : null}
      </View>
      {judge.introVideoUrl ? (
        <Touchable onPress={onPlayIntro} style={styles.intro} accessibilityRole="button" accessibilityLabel={t('introVideo')}>
          <View style={styles.play}>
            <Ionicons name="play" size={20} color={colors.primary} style={{ marginLeft: 3 }} />
          </View>
          <AppText size={12} color={colors.textSecondary}>
            {t('introVideo')}
          </AppText>
        </Touchable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  photo: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.divider },
  info: { flex: 1 },
  intro: { alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
