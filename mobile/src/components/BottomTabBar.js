import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { Touchable } from './ui/Pressable';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../auth/AuthContext';
import { colors, radius } from '../theme';

function Tab({ icon, label, active, onPress, children }) {
  const color = active ? colors.primary : colors.textMuted;
  return (
    <Touchable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      {children ?? <Ionicons name={icon} size={24} color={color} />}
      <AppText size={11} weight={active ? 'semibold' : 'regular'} color={color}>
        {label}
      </AppText>
    </Touchable>
  );
}

export function BottomTabBar({ active = 'competitions', onNavigate }) {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      <Tab icon="home" label={t('nav.home')} active={active === 'home'} onPress={() => onNavigate('home')} />
      <Tab icon="search" label={t('nav.explore')} active={active === 'explore'} onPress={() => onNavigate('explore')} />
      <Touchable onPress={() => onNavigate('create')} style={styles.create} accessibilityRole="button" accessibilityLabel="Create">
        <View style={styles.createInner}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </View>
      </Touchable>
      <Tab icon="trophy" label={t('nav.competitions')} active={active === 'competitions'} onPress={() => onNavigate('competitions')} />
      <Tab label={t('nav.profile')} active={active === 'profile'} onPress={() => onNavigate('profile')}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle" size={28} color={colors.textMuted} />
        )}
      </Tab>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 4, backgroundColor: '#fff' },
  tab: { alignItems: 'center', gap: 2, minWidth: 60 },
  create: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 8 },
  createInner: { backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14 },
});
