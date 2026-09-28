import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius } from '../../theme';

export function Chip({ label }) {
  return (
    <View style={styles.chip}>
      <AppText size={12} weight="medium" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: '#F2F5F5', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 3 },
});
