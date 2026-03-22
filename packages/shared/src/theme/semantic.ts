import { palette, brandColors } from './palette';

export const lightTheme = {
  background: brandColors.whiteSmoke,
  surface: '#FFFFFF',
  text: brandColors.graphite,
  textSecondary: palette.grey[500],
  primary: brandColors.frenchBlue,
  primaryLight: palette.blue[100],
  border: palette.grey[200],
  danger: palette.red[600],
  success: palette.green[600],
  warning: palette.amber[500],
} as const;

export const darkTheme = {
  background: palette.grey[900],
  surface: brandColors.graphite,
  text: brandColors.whiteSmoke,
  textSecondary: palette.grey[400],
  primary: brandColors.smartBlue,
  primaryLight: palette.indigo[900],
  border: palette.grey[700],
  danger: palette.red[500],
  success: palette.green[500],
  warning: palette.amber[400],
} as const;

export type SemanticTheme = typeof lightTheme;
