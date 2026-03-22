import { ThemeProvider } from '@/contexts/ThemeContext';
import MainNavigator from '@/navigation/MainNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <MainNavigator />
    </ThemeProvider>
  );
}
