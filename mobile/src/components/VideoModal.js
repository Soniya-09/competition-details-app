import { Modal, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { Touchable } from './ui/Pressable';
import { colors, spacing } from '../theme';

function Player({ uri }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

export function VideoModal({ video, onClose }) {
  return (
    <Modal visible={Boolean(video)} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.top}>
          <AppText weight="semibold" color="#fff" style={styles.title} numberOfLines={1}>
            {video?.title}
          </AppText>
          <Touchable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close video">
            <Ionicons name="close" size={28} color="#fff" />
          </Touchable>
        </View>
        {video ? <Player uri={video.uri} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  top: { position: 'absolute', top: 48, left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  title: { flex: 1 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.text },
});
