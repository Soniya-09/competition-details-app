import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useErrorMessage, useI18n } from '../i18n/I18nContext';
import { AppText } from '../components/ui/AppText';
import { Touchable } from '../components/ui/Pressable';
import { ErrorState } from '../components/ui/ErrorState';
import { colors, radius, shadow, spacing } from '../theme';

export function TestimonialsScreen({ navigation }) {
  const { t, lang } = useI18n();
  const errorMessage = useErrorMessage();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    api.testimonials().then(setItems).catch(setError);
  };
  useEffect(load, [lang]);

  return (
    <SafeAreaView style={styles.screen}>
      <Touchable onPress={() => navigation.goBack()} style={styles.header}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <AppText size={18} weight="semibold">
          {t('testimonials')}
        </AppText>
      </Touchable>
      {!items && !error ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
      {error ? <ErrorState title={t('loadFailed')} message={errorMessage(error)} actionLabel={t('retry')} onAction={load} /> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                <AppText weight="semibold" style={styles.flex}>
                  {item.name}
                </AppText>
                <AppText color={colors.gold}>{'★'.repeat(item.rating ?? 0)}</AppText>
              </View>
              <AppText color={colors.textSecondary}>“{item.quote}”</AppText>
            </View>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.divider },
  flex: { flex: 1 },
});
