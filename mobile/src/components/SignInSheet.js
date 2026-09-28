import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './ui/BottomSheet';
import { AppText } from './ui/AppText';
import { Touchable } from './ui/Pressable';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useErrorMessage, useI18n } from '../i18n/I18nContext';
import { colors, radius, spacing } from '../theme';

export function SignInSheet() {
  const { t } = useI18n();
  const errorMessage = useErrorMessage();
  const { user, signIn, signOut, signInVisible, dismissSignIn } = useAuth();
  const [users, setUsers] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!signInVisible) return;
    setError(null);
    api.demoUsers().then(setUsers).catch(setError);
  }, [signInVisible]);

  const choose = async (id) => {
    setPendingId(id);
    setError(null);
    try {
      await signIn(id);
    } catch (err) {
      setError(err);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <BottomSheet visible={signInVisible} onClose={dismissSignIn}>
      <AppText weight="bold" size={18}>
        {t('chooseAccount')}
      </AppText>
      <AppText color={colors.textSecondary}>{user ? t('signedInAs', { name: user.name }) : t('chooseAccountSub')}</AppText>

      {!users && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <AppText color={colors.danger}>{errorMessage(error)}</AppText> : null}

      {users?.map((u) => {
        const current = u.id === user?.id;
        return (
          <Touchable key={u.id} onPress={() => choose(u.id)} disabled={Boolean(pendingId)} style={[styles.row, current && styles.current]}>
            <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
            <View style={styles.flex}>
              <AppText weight="semibold">{u.name}</AppText>
              <AppText size={12} color={colors.textSecondary}>
                {u.email}
              </AppText>
            </View>
            {pendingId === u.id ? <ActivityIndicator color={colors.primary} /> : null}
            {current ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
          </Touchable>
        );
      })}

      <Touchable
        onPress={() => {
          if (user) signOut();
          dismissSignIn();
        }}
        style={styles.secondary}
      >
        <AppText weight="medium" color={colors.textSecondary}>
          {user ? t('signOut') : t('continueAsGuest')}
        </AppText>
      </Touchable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  current: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider },
  secondary: { alignItems: 'center', paddingVertical: spacing.sm },
});
