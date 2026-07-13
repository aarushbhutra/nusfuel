import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

const lightColors = Object.freeze({
  background: "#F7FCF8",
  surface: "#FFFFFF",
  surfaceRaised: "#EAF7EC",
  text: "#173A26",
  muted: "#557363",
  line: "#CDE5D2",
  accent: "#58CC02",
  accentText: "#14310F",
  danger: "#C83F35",
  warningBackground: "#FFF5E6",
  warningBorder: "#E8B36B",
  warningTitle: "#86500E",
  warningText: "#6E4A1B",
});

const darkColors = Object.freeze({
  background: "#0F1D14",
  surface: "#17291D",
  surfaceRaised: "#203A27",
  text: "#F3FFF4",
  muted: "#A9C5B0",
  line: "#31553B",
  accent: "#78D84A",
  accentText: "#10260E",
  danger: "#FF9B91",
  warningBackground: "#352A1C",
  warningBorder: "#896333",
  warningTitle: "#FFD89A",
  warningText: "#F0C98F",
});

export const colors = lightColors;

export function useTheme(createStyles) {
  const scheme = useColorScheme();
  const activeColors = scheme === "dark" ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(activeColors), [activeColors, createStyles]);
  return { colors: activeColors, styles, scheme: scheme === "dark" ? "dark" : "light" };
}

export const radius = 16;

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 40,
});
