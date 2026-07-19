import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { fontFamily, spacing, useTheme } from "../theme.js";

const TABS = [
  { id: "home", label: "Today" },
  { id: "menu", label: "Menu" },
  { id: "recommendations", label: "Picks" },
  { id: "progress", label: "Progress" },
];

export function AppFrame({ activeTab, children, onNavigate }) {
  const { styles } = useTheme(createStyles);

  return (
    <View style={styles.frame}>
      <View style={styles.content}>{children}</View>
      <SafeAreaView style={styles.navigationSafeArea}>
        <View accessibilityRole="tablist" style={styles.navigation}>
          {TABS.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={tab.id}
                onPress={() => onNavigate(tab.id)}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <View style={[styles.indicator, selected && styles.indicatorSelected]} />
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  frame: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navigationSafeArea: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  navigation: {
    flexDirection: "row",
    minHeight: 64,
    paddingTop: spacing.sm,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  indicator: {
    backgroundColor: "transparent",
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.xs,
    width: 20,
  },
  indicatorSelected: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
    fontWeight: "700",
  },
  tabLabelSelected: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.72,
  },
});
