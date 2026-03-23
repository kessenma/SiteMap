import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PowerSyncProvider } from '@/hooks/powersync/usePowerSync';
import MainNavigator from '@/navigation/MainNavigator';

function AppWithSync() {
  const { isAuthenticated, getPowerSyncToken } = useAuth();

  return (
    <PowerSyncProvider getToken={isAuthenticated ? getPowerSyncToken : undefined}>
      <MainNavigator />
    </PowerSyncProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AppWithSync />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
