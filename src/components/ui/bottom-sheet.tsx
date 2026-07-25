'use no memo';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme-colors';

const DEFAULT_SNAP_POINTS: (string | number)[] = ['40%', '70%'];

export type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Default e.g. ['40%', '70%'] or similar sensible snaps */
  snapPoints?: (string | number)[];
  title?: string;
  /** Optional footer actions row */
  footer?: React.ReactNode;
};

/**
 * Controlled bottom sheet. Uses RN Modal as the host so `visible` is reliable
 * (BottomSheetModal.present() is easy to miss with React Compiler / effect timing).
 * GestureHandlerRootView is required inside Modal on Android.
 */
export function AppBottomSheet({
  visible,
  onClose,
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  title,
  footer,
}: AppBottomSheetProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const resolvedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.flex}>
          <BottomSheet
            index={0}
            snapPoints={resolvedSnapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose
            onClose={onClose}
            backdropComponent={renderBackdrop}
            backgroundStyle={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
            handleIndicatorStyle={{
              backgroundColor: colors.placeholder,
              width: 40,
              height: 4,
            }}
          >
            <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
              <View className="border-border bg-card px-6 pt-1">
                {title ? (
                  <Text variant="subtitle" className="mb-3">
                    {title}
                  </Text>
                ) : null}
                {children}
                {footer ? <View className="mt-4">{footer}</View> : null}
              </View>
            </BottomSheetView>
          </BottomSheet>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

/** Vertical spacing between stacked labels/inputs inside bottom-sheet forms. */
export function BottomSheetFormFields({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return <View className={cn('gap-5', className)}>{children}</View>;
}
