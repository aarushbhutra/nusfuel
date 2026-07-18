import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

const lightColors = Object.freeze({
  background: "#F6F2EB",
  surface: "#FFFDF8",
  surfaceRaised: "#ECE7DE",
  text: "#1F2521",
  muted: "#5A655E",
  line: "#D4CBC0",
  accent: "#C45B32",
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

export const radius = 12;
export const radiusLarge = 14;
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
