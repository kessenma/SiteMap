import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption } from '../ui/Typography';

export type SheetTab = 'legend' | 'comments' | 'paths' | 'lists' | 'details';

type TabDef = {
  key: SheetTab;
  label: string;
  count?: number;
};

export function MapContentSheet({
  sheetRef,
  activeTab,
  onTabChange,
  tabs,
  children,
  onSheetChange,
}: {
  sheetRef: React.RefObject<GorhomBottomSheet | null>;
  activeTab: SheetTab;
  onTabChange: (tab: SheetTab) => void;
  tabs: TabDef[];
  children: React.ReactNode;
  onSheetChange?: (index: number) => void;
}) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['12%', '50%', '85%'], []);

  const handleTabPress = useCallback((tab: SheetTab) => {
    onTabChange(tab);
    // Expand to 50% when a tab is tapped
    sheetRef.current?.snapToIndex(1);
  }, [onTabChange, sheetRef]);

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
      onChange={onSheetChange}
      handleComponent={() => (
        <View style={[styles.handleArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handleBar, { backgroundColor: colors.textSecondary }]} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  <Caption
                    style={{
                      ...styles.tabLabel,
                      color: isActive ? '#fff' : colors.textSecondary,
                    }}
                  >
                    {tab.label}
                    {tab.count != null && tab.count > 0 ? ` (${tab.count})` : ''}
                  </Caption>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {children}
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  handleArea: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    opacity: 0.4,
  },
  tabBar: {
    paddingHorizontal: 12,
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
});
