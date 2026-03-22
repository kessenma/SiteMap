import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Menu, ChevronLeft, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

export const SIDEBAR_EXPANDED = 200;
export const SIDEBAR_COLLAPSED = 70;

export const TabletSidebar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(true);

  const sidebarWidth = useSharedValue(SIDEBAR_EXPANDED);

  useEffect(() => {
    sidebarWidth.value = withTiming(expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED, {
      duration: 250,
    });
  }, [expanded]);

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const labelOpacity = useSharedValue(1);
  useEffect(() => {
    labelOpacity.value = withTiming(expanded ? 1 : 0, { duration: 200 });
  }, [expanded]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    maxWidth: interpolate(labelOpacity.value, [0, 1], [0, 120], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
        },
        sidebarAnimatedStyle,
      ]}
    >
      {/* Toggle button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        {expanded ? (
          <ChevronLeft size={22} color={colors.textSecondary} />
        ) : (
          <Menu size={22} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Tab items */}
      <View style={styles.tabList}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;
          const IconComponent = options.tabBarIcon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && { backgroundColor: colors.primary + '15' },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                {IconComponent &&
                  IconComponent({
                    focused: isFocused,
                    color: isFocused ? colors.primary : colors.textSecondary,
                    size: 24,
                  })}
                {options.tabBarBadge != null && (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                  </View>
                )}
              </View>

              <Animated.Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primary : colors.textSecondary },
                  isFocused && { fontWeight: '600' },
                  labelAnimatedStyle,
                ]}
                numberOfLines={1}
              >
                {label as string}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  tabList: {
    flex: 1,
    gap: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    gap: 12,
  },
  tabIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
