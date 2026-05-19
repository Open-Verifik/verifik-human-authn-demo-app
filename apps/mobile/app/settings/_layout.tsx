import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="api-key" />
      <Stack.Screen name="language" />
    </Stack>
  );
}
