import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, spacing } from '../../theme';

const COLLAPSED_LINES = 3;

export function InfoTabs({ about, judgingParameters, rules }) {
  const { t } = useI18n();
  const [active, setActive] = useState('about');
  const [expanded, setExpanded] = useState(false);

  const tabs = [
    { key: 'about', label: t('aboutCompetition'), lines: about.split('\n').filter(Boolean), bullets: false },
    { key: 'judging', label: t('judgingParameters'), lines: judgingParameters, bullets: true },
    { key: 'rules', label: t('rulesEligibility'), lines: rules, bullets: true },
  ];
  const current = tabs.find((tab) => tab.key === active);
  const visible = expanded ? current.lines : current.lines.slice(0, COLLAPSED_LINES);
  const canExpand = current.lines.length > COLLAPSED_LINES;

  return (
    <Card>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <Touchable
              key={tab.key}
              onPress={() => {
                setActive(tab.key);
                setExpanded(false);
              }}
              style={[styles.tab, selected && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <AppText
                size={13}
                weight={selected ? 'semibold' : 'medium'}
                color={selected ? colors.primary : colors.textSecondary}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
            </Touchable>
          );
        })}
      </View>

      <View style={styles.body}>
        {visible.map((line, i) => (
          <View key={i} style={styles.line}>
            {current.bullets ? <View style={styles.bullet} /> : null}
            <AppText size={14} color={colors.textSecondary} style={styles.lineText}>
              {line}
            </AppText>
          </View>
        ))}
      </View>

      {canExpand ? (
        <Touchable onPress={() => setExpanded((v) => !v)} style={styles.more} accessibilityRole="button">
          <AppText size={14} weight="medium" color={colors.primary}>
            {expanded ? t('viewLess') : t('viewMore')}
          </AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </Touchable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.divider },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.primary },
  body: { paddingTop: spacing.md, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9, marginRight: spacing.sm },
  lineText: { flex: 1 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
});
