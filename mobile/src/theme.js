import { useMemo } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";

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

const darkColors = Object.freeze({
  background: "#1B1D1B",
  surface: "#252925",
  surfaceRaised: "#30362F",
  text: "#FAF6EE",
  muted: "#B4B9AF",
  line: "#4A5149",
  accent: "#E08351",
  accentText: "#1D201D",
  danger: "#F08C82",
  warningBackground: "#3A3024",
  warningBorder: "#9C7445",
  warningTitle: "#FFD39A",
  warningText: "#E9C692",
});

export const colors = lightColors;

export function useTheme(createStyles) {
  const scheme = useColorScheme();
  const activeColors = scheme === "dark" ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(activeColors), [activeColors, createStyles]);
  return { colors: activeColors, styles, scheme: scheme === "dark" ? "dark" : "light" };
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
