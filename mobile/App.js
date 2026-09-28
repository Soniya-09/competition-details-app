import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { I18nProvider } from './src/i18n/I18nContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { CompetitionDetailsScreen } from './src/screens/CompetitionDetailsScreen';
import { CompetitionsScreen } from './src/screens/CompetitionsScreen';
import { TestimonialsScreen } from './src/screens/TestimonialsScreen';
import { SignInSheet } from './src/components/SignInSheet';
import { DEFAULT_COMPETITION_SLUG } from './src/config';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

function Root() {
  const { ready } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CompetitionDetails" screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="CompetitionDetails"
            component={CompetitionDetailsScreen}
            initialParams={{ slug: DEFAULT_COMPETITION_SLUG }}
          />
          <Stack.Screen name="Competitions" component={CompetitionsScreen} />
          <Stack.Screen name="Testimonials" component={TestimonialsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <SignInSheet />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
