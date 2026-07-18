import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { searchMeals } from "../lib/api/search.js";
import { getMenu } from "../lib/api/menu.js";
import { filterPreviewMenu, PREVIEW_MENU } from "../lib/menuPreview.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function MenuBrowseScreen({ apiBaseUrl, authSession, onSelect, onBack }) {
  const { colors, styles } = useTheme(createStyles);
  const preview = !apiBaseUrl || !authSession?.accessToken;
  const [items, setItems] = useState(preview ? PREVIEW_MENU : []);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchNote, setSearchNote] = useState("");

  const loadMenu = useCallback(async () => {
    if (preview) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(
        await getMenu({
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the menu.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authSession, preview]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const runSearch = useCallback(async () => {
    const mealRequest = query.trim();
    setSearchError("");
    setSearchNote("");
    setSearchItems(null);
    if (!mealRequest) {
      setSearchItems([]);
      setSearchNote("Tell us what you feel like eating, then search stored Techno Edge meals.");
      return;
    }

    setSearching(true);
    try {
      const result = preview
        ? { items: filterPreviewMenu(mealRequest), usedFallback: true }
        : await searchMeals(mealRequest, {
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        });
      const matches = Array.isArray(result.items) ? result.items : [];
      setSearchItems(matches);
      setSearchNote(matches.length
        ? result.usedFallback ? "Showing stored keyword matches." : `${matches.length} stored meal${matches.length === 1 ? "" : "s"} found.`
        : "No stored Techno Edge meals match that request. Try a meal, ingredient, or stall.");
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : "Could not search stored meals.");
    } finally {
      setSearching(false);
    }
  }, [apiBaseUrl, authSession, preview, query]);

  const clearSearch = () => {
    setQuery("");
    setSearchError("");
    setSearchItems(null);
    setSearchNote("");
  };

  const sections = useMemo(() => {
    const grouped = new Map();
    for (const item of items) {
      if (!grouped.has(item.stall)) {
        grouped.set(item.stall, []);
      }
      grouped.get(item.stall).push(item);
    }
    return [...grouped].map(([title, data]) => ({ title, data }));
  }, [items]);
  const visibleSections = searchItems === null
    ? sections
    : searchItems.length ? [{ title: "Search results", data: searchItems }] : [];

  return (
    <SafeAreaView style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.stateText}>Reading the Techno Edge menu.</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>The menu is out of reach.</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadMenu}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : searchItems !== null ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>No stored match yet.</Text>
              <Text style={styles.stateText}>{searchNote}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearSearch}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>Browse full menu</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>No meals yet.</Text>
              <Text style={styles.stateText}>There are no stored Techno Edge meals to show.</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.brandLockup}>
                <View style={styles.brandMark}>
                  <View style={styles.brandDot} />
                </View>
                <Text style={styles.brand}>NUSFuel</Text>
              </View>
              {onBack ? (
                <Pressable
                  accessibilityLabel="Back to saved target"
                  accessibilityRole="button"
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                  <Text style={styles.backText}>Back to target</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>TECHNO EDGE / MENU</Text>
              <Text style={styles.title}>Choose your next meal.</Text>
              <Text style={styles.copy}>
                Search by what you feel like eating, or browse stored meals by stall.
              </Text>
            </View>
            <View style={styles.searchBox}>
              <Text style={styles.searchLabel}>FIND A MEAL</Text>
              <View style={styles.searchRow}>
                <TextInput
                  accessibilityHint="Searches stored Techno Edge meals only."
                  accessibilityLabel="Describe the meal you want"
                  editable={!searching}
                  onChangeText={setQuery}
                  onSubmitEditing={runSearch}
                  placeholder="e.g. high-protein fish without peanuts"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={query}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: searching }}
                  disabled={searching}
                  onPress={runSearch}
                  style={({ pressed }) => [styles.searchButton, searching && styles.searchButtonDisabled, pressed && styles.pressed]}
                >
                  <Text style={styles.searchButtonText}>{searching ? "Finding" : "Search"}</Text>
                </Pressable>
              </View>
              {searching ? <View style={styles.searching}><ActivityIndicator color={colors.accent} size="small" /><Text style={styles.searchingText}>Searching stored meals.</Text></View> : null}
              {searchError ? (
                <View style={styles.searchFeedback}>
                  <Text style={styles.searchFeedbackText}>{searchError}</Text>
                  <Pressable accessibilityRole="button" onPress={runSearch} style={({ pressed }) => [styles.clearSearch, pressed && styles.pressed]}>
                    <Text style={styles.clearSearchText}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
              {searchItems?.length ? (
                <View style={styles.searchFeedback}>
                  <Text style={styles.searchFeedbackText}>{searchNote}</Text>
                  <Pressable accessibilityRole="button" onPress={clearSearch} style={({ pressed }) => [styles.clearSearch, pressed && styles.pressed]}>
                    <Text style={styles.clearSearchText}>Clear search</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            {preview ? <Text style={styles.previewNote}>Preview menu and search. Connected data appears here when signed in.</Text> : null}
          </View>
        }
        renderItem={({ item }) => <MealRow item={item} onPress={() => onSelect(item)} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionRule} />
          </View>
        )}
        sections={visibleSections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function MealRow({ item, onPress }) {
  const { styles } = useTheme(createStyles);

  return (
    <Pressable
      accessibilityLabel={`View ${item.name}, ${item.nutrition.energyKcal} kilocalories`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.mealRow, pressed && styles.pressed]}
    >
      <View style={styles.mealCopy}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealMeta}>{item.serving.quantity} {item.serving.unit} / {item.nutrition.proteinG} g protein</Text>
      </View>
      <View style={styles.mealEnergy}>
        <View style={styles.energyBadge}>
          <Text style={styles.energyValue}>{item.nutrition.energyKcal}</Text>
          <Text style={styles.energyLabel}>kcal</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: 24,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  brandDot: {
    backgroundColor: colors.accentText,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  backButton: {
    justifyContent: "center",
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  backText: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    fontWeight: "700",
  },
  hero: {
    marginTop: 48,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 35,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 40,
    marginTop: spacing.md,
  },
  copy: {
    color: colors.muted,
    fontFamily,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  previewNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  searchBox: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  searchLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily,
    fontSize: 13,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  searchButtonDisabled: {
    opacity: 0.65,
  },
  searchButtonText: {
    color: colors.accentText,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
  },
  searching: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.md,
  },
  searchingText: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    marginLeft: spacing.sm,
  },
  searchFeedback: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  searchFeedbackText: {
    color: colors.muted,
    flex: 1,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    paddingRight: spacing.sm,
  },
  clearSearch: {
    justifyContent: "center",
    minHeight: 36,
  },
  clearSearchText: {
    color: colors.text,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.sm,
    marginTop: spacing.section,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  sectionRule: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1,
    marginLeft: spacing.md,
  },
  mealRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.sm,
    minHeight: 82,
    paddingRight: spacing.lg,
  },
  mealCopy: {
    flex: 1,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  mealName: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  mealMeta: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  mealEnergy: {
    alignItems: "flex-end",
  },
  energyBadge: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    minWidth: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  energyValue: {
    color: colors.accent,
    fontFamily,
    fontSize: 17,
    fontWeight: "800",
  },
  energyLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    marginTop: 2,
  },
  state: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.section,
  },
  stateTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
