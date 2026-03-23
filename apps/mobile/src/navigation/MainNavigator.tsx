import React, { useState } from 'react';
import { ActivityIndicator, View, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, Database, ClipboardList, Bell, User, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useIsTablet } from '../hooks/useIsTablet';
import { TabletSidebar } from '../components/navigation/TabletNavigation';
import MapScreen from '../screens/MapScreen';
import DataScreen from '../screens/DataScreen';
import TasksScreen from '../screens/TasksScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddMapScreen from '../screens/AddMapScreen';
import AddFacilityScreen from '../screens/AddFacilityScreen';
import MapViewerScreen from '../screens/MapViewerScreen';
import KeyEditorScreen from '../screens/KeyEditorScreen';
import MarkerDetailScreen from '../screens/MarkerDetailScreen';
import ITServiceRequestScreen from '../screens/ITServiceRequestScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

export type RootStackParamList = {
  HomeTabs: undefined;
  AddMap: undefined;
  AddFacility: undefined;
  MapViewer: { mapId: string; mapName: string };
  KeyEditor: { mapId: string };
  MarkerDetail: { markerId: string; markerLabel: string };
  ITServiceRequest: { mapId: string; mapName: string };
};

export type TabParamList = {
  Map: undefined;
  Data: undefined;
  Tasks: undefined;
  Alerts: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function HomeTabs() {
  const { colors } = useTheme();
  const isTablet = useIsTablet();

  return (
    <Tab.Navigator
      tabBar={isTablet ? (props) => <TabletSidebar {...props} /> : undefined}
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Data"
        component={DataScreen}
        options={{
          title: 'Data',
          tabBarIcon: ({ color, size }) => <Database color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthScreens() {
  const [showSignup, setShowSignup] = useState(false);

  if (showSignup) {
    return <SignupScreen onNavigateToLogin={() => setShowSignup(false)} />;
  }

  return <LoginScreen onNavigateToSignup={() => setShowSignup(true)} />;
}

export default function MainNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.danger,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' as const },
            medium: { fontFamily: 'System', fontWeight: '500' as const },
            bold: { fontFamily: 'System', fontWeight: '700' as const },
            heavy: { fontFamily: 'System', fontWeight: '900' as const },
          },
        }}
      >
        <AuthScreens />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddMap"
          component={AddMapScreen}
          options={{ title: 'Add Map' }}
        />
        <Stack.Screen
          name="AddFacility"
          component={AddFacilityScreen}
          options={{ title: 'Add Facility' }}
        />
        <Stack.Screen
          name="MapViewer"
          component={MapViewerScreen}
          options={({ route, navigation }) => ({
            title: route.params.mapName,
            headerLeft: () => (
              <Pressable
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 8, padding: 8 }}
              >
                <ChevronLeft size={24} color={colors.text} />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="KeyEditor"
          component={KeyEditorScreen}
          options={{ title: 'Map Legend' }}
        />
        <Stack.Screen
          name="MarkerDetail"
          component={MarkerDetailScreen}
          options={({ route }) => ({ title: route.params.markerLabel })}
        />
        <Stack.Screen
          name="ITServiceRequest"
          component={ITServiceRequestScreen}
          options={({ route }) => ({ title: `Request · ${route.params.mapName}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
