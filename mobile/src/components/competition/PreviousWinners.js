import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { Touchable } from '../ui/Pressable';
import { useI18n } from '../../i18n/I18nContext';
import { colors, radius, spacing } from '../../theme';

function WinnerCard({ winner, onPlay }) {
  const { ordinalWinner } = useI18n();
  return (
    <Touchable
      onPress={() => onPlay(winner)}
      disabled={!winner.videoUrl}
      style={styles.winner}
      accessibilityRole="button"
      accessibilityLabel={`${winner.name}, ${ordinalWinner(winner.position)}`}
    >
      <View>
        <Image source={{ uri: winner.thumbnailUrl }} style={styles.thumb} />
        {winner.videoUrl ? (
          <View style={styles.playBadge}>
            <Ionicons name="play" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <AppText size={13} weight="medium" numberOfLines={1}>
          {winner.name}
        </AppText>
        <AppText size={12} color={colors.primary} numberOfLines={1}>
          {ordinalWinner(winner.position)}
        </AppText>
      </View>
    </Touchable>
  );
}

export function PreviousWinners({ winners, onPlay }) {
  const { t } = useI18n();
  if (!winners?.length) return null;
  return (
    <Card title={t('previousWinners')} padded={false} style={styles.card}>
      <FlatList
        horizontal
        data={winners}
        keyExtractor={(w, i) => `${w.name}-${i}`}
        renderItem={({ item }) => <WinnerCard winner={item} onPlay={onPlay} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: spacing.lg, paddingBottom: spacing.md, paddingLeft: spacing.lg },
  list: { gap: spacing.sm, paddingRight: spacing.lg },
  winner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F7',
    borderRadius: radius.md,
    paddingRight: spacing.md,
    width: 180,
    overflow: 'hidden',
  },
  thumb: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.divider },
  playBadge: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, marginLeft: spacing.md },
});
