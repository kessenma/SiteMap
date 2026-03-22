import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import MainNavigator from '@/navigation/MainNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
