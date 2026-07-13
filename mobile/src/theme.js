import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

const lightColors = Object.freeze({
  background: "#F5F0E8",
  surface: "#FFFDF8",
  surfaceRaised: "#E9E2D7",
  text: "#1F2521",
  muted: "#667068",
  line: "#D7CEC2",
  accent: "#D26A3A",
  accentText: "#FFF9F2",
  danger: "#B33C32",
  warningBackground: "#FBEDD6",
  warningBorder: "#D8A36B",
  warningTitle: "#7C4818",
  warningText: "#6D4A26",
});

export const colors = lightColors;

export function useTheme(createStyles) {
  const styles = useMemo(() => createStyles(lightColors), [createStyles]);
  return { colors: lightColors, styles, scheme: "light" };
}

export const radius = 16;
export const radiusLarge = 20;
export const radiusPill = 999;
export const fontFamily = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 40,
});
