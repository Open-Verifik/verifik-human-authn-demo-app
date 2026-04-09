import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor="#010333" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#010333' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="auth/index" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="demos/liveness" />
        <Stack.Screen
          name="demos/face-comparison"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="demos/face-comparison-liveness"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="demos/humanid" />
        <Stack.Screen name="demos/face-detection" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#010333',
  },
});
