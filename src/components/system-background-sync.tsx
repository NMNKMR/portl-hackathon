import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

import { useThemeColors } from "@/lib/theme-colors";

/** Keeps the native root background in sync with theme to avoid white flashes. */
export function SystemBackgroundSync() {
  const { background } = useThemeColors();

  useEffect(() => {
    if (!background) return;
    SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  return null;
}
