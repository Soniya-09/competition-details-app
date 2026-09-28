import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, radius, spacing } from '../../theme';

const LANGS = [
  { code: 'en', label: 'ENG' },
  { code: 'hi', label: 'हिंदी' },
];

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.toggle} accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <Touchable
            key={l.code}
            onPress={() => setLang(l.code)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            hitSlop={4}
          >
            <AppText size={13} weight={active ? 'semibold' : 'medium'} color={active ? '#fff' : colors.text}>
              {l.label}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
}

export function Header({ onBack }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Touchable onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel={t('goBack')}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <AppText size={16} weight="medium">
          {t('goBack')}
        </AppText>
      </Touchable>
      <LanguageToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F2',
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill, minWidth: 56, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primaryDark },
});
