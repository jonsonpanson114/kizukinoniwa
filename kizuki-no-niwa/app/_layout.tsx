import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../components/AuthProvider';

import { ErrorBoundary } from 'react-error-boundary';
import { View, Text, ScrollView } from 'react-native';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#DC2626' }}>Oops! Something went wrong.</Text>
      <ScrollView style={{ maxHeight: 200, width: '100%' }}>
        <Text style={{ fontFamily: 'monospace', color: '#333' }}>{error.message}</Text>
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F5F5F0' }, // Washi color
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="write" />
            <Stack.Screen name="story/[id]" />
            <Stack.Screen name="kizuki/index" />
            <Stack.Screen name="dialogue/[id]" />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
