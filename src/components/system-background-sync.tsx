import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

import { useThemeColors } from "@/lib/theme-colors";

/** Keeps the native root background in sync with theme to avoid white flashes. */
export function SystemBackgroundSync() {
  const { background } = useThemeColors();

  useEffect(() => {
    // if (!background) return;
    void SystemUI.setBackgroundColorAsync("#1A1816");
  }, []);

  return null;
}
