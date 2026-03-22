import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, Database, ClipboardList, Bell, Plus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import MapScreen from '../screens/MapScreen';
import DataScreen from '../screens/DataScreen';
import TasksScreen from '../screens/TasksScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AddMapScreen from '../screens/AddMapScreen';
import MapViewerScreen from '../screens/MapViewerScreen';
import KeyEditorScreen from '../screens/KeyEditorScreen';
import MarkerDetailScreen from '../screens/MarkerDetailScreen';

export type RootStackParamList = {
  HomeTabs: undefined;
  AddMap: undefined;
  MapViewer: { mapId: string; mapName: string };
  KeyEditor: { mapId: string };
  MarkerDetail: { markerId: string; markerLabel: string };
};

export type TabParamList = {
  Map: undefined;
  Data: undefined;
  Tasks: undefined;
  Alerts: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function HomeTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
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
        options={({ navigation }) => ({
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('AddMap')}
              style={{ marginRight: 16 }}
            >
              <Plus color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        })}
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
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { colors, isDark } = useTheme();

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
          name="MapViewer"
          component={MapViewerScreen}
          options={({ route }) => ({ title: route.params.mapName })}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
