import React, { useCallback, useMemo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/contexts/ThemeContext';
import { H3 } from './Typography';

interface BottomSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheet | null>;
  title?: string;
  children: ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
}

export function BottomSheet({
  sheetRef,
  title,
  children,
  snapPoints: customSnaps,
  onClose,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => customSnaps ?? ['50%', '80%'], [customSnaps]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      {title && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <H3>{title}</H3>
        </View>
      )}
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {children}
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
});
