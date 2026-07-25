import { useCSSVariable } from 'uniwind';

/**
 * Theme colors for props that require a JS color string (Icon, TextInput
 * placeholderTextColor, SystemUI, etc.). Prefer className for layout/fill.
 * Never hardcode hex in components — use this hook or `theme-tokens.ts`.
 */
export function useThemeColors() {
  const [
    background,
    foreground,
    muted,
    primary,
    accent,
    danger,
    success,
    border,
    card,
    neutral400,
    google,
    onPrimary,
    roleAdmin,
    roleResident,
    roleGuard,
    statTeal,
    statOrange,
    statBlue,
  ] = useCSSVariable([
    '--color-background',
    '--color-foreground',
    '--color-muted',
    '--color-primary',
    '--color-accent',
    '--color-danger',
    '--color-success',
    '--color-border',
    '--color-card',
    '--color-neutral-400',
    '--color-google',
    '--color-on-primary',
    '--color-role-admin',
    '--color-role-resident',
    '--color-role-guard',
    '--color-stat-teal',
    '--color-stat-orange',
    '--color-stat-blue',
  ]) as Array<string | number | undefined>;

  return {
    background: String(background ?? ''),
    foreground: String(foreground ?? ''),
    muted: String(muted ?? ''),
    primary: String(primary ?? ''),
    accent: String(accent ?? ''),
    danger: String(danger ?? ''),
    success: String(success ?? ''),
    border: String(border ?? ''),
    card: String(card ?? ''),
    placeholder: String(neutral400 ?? ''),
    google: String(google ?? ''),
    onPrimary: String(onPrimary ?? ''),
    roleAdmin: String(roleAdmin ?? ''),
    roleResident: String(roleResident ?? ''),
    roleGuard: String(roleGuard ?? ''),
    statTeal: String(statTeal ?? ''),
    statOrange: String(statOrange ?? ''),
    statBlue: String(statBlue ?? ''),
  };
}
