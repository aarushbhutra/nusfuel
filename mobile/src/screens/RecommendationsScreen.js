import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMenuItem } from "../lib/api/menu.js";
import { getRecommendations } from "../lib/api/recommendations.js";
import { PREVIEW_MENU, PREVIEW_RECOMMENDATIONS } from "../lib/menuPreview.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function RecommendationsScreen({ apiBaseUrl, authSession, onBack, onSelect }) {
  const { colors, styles } = useTheme(createStyles);
  const preview = !apiBaseUrl || !authSession?.accessToken;
  const [cards, setCards] = useState(() => (preview ? previewCards() : []));
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");

  const loadRecommendations = useCallback(async () => {
    if (preview) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const recommendations = await getRecommendations("daily", {
        accessToken: authSession.accessToken,
        baseUrl: apiBaseUrl,
      });
      setCards(await Promise.all(recommendations.map(async (recommendation) => ({
        recommendation,
        item: await getMenuItem(recommendation.menuItemId, {
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        }),
      }))));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authSession, preview]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>NUSFuel</Text>
          <Pressable
            accessibilityLabel="Back to saved target"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>Back to target</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TODAY / RECOMMENDED</Text>
          <Text style={styles.title}>A focused next meal.</Text>
          <Text style={styles.copy}>Stored Techno Edge meals, ranked against what remains in your daily target.</Text>
        </View>

        {preview ? <Text style={styles.previewNote}>Preview recommendations. Connected data appears here when signed in.</Text> : null}
        {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.stateText}>Finding your next meal.</Text></View> : null}
        {error ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Recommendations are out of reach.</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={loadRecommendations} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error && cards.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>No recommendations yet.</Text>
            <Text style={styles.stateText}>Log a meal or check back after your target is available.</Text>
          </View>
        ) : null}
        {cards.map((card) => <RecommendationCard card={card} key={card.recommendation.menuItemId} onPress={() => onSelect(card.item)} styles={styles} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendationCard({ card, onPress, styles }) {
  const { item, recommendation } = card;
  const warnings = recommendation.allergenWarnings?.length
    ? recommendation.allergenWarnings
    : item.allergens?.incomplete ? ["Allergen data incomplete: check with the stall before ordering."] : [];

  return (
    <Pressable
      accessibilityLabel={`View recommended meal ${item.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTopLine}>
        <Text style={styles.rank}>PICK {recommendation.rank}</Text>
        <Text style={styles.stall}>{item.stall}</Text>
      </View>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.reason}>{recommendation.fitReason}</Text>
      <View style={styles.nutritionRow}>
        <Metric label="Energy" value={`${formatNumber(recommendation.nutritionImpact.energyKcal)} kcal`} styles={styles} />
        <View style={styles.metricDivider} />
        <Metric label="Protein" value={`${formatNumber(recommendation.nutritionImpact.proteinG)} g`} styles={styles} />
      </View>
      {warnings.map((warning) => <Text key={warning} style={styles.warning}>Allergen check: {warning}</Text>)}
      <Text style={styles.source}>Source: {item.source.name} / {item.source.confidence}</Text>
    </Pressable>
  );
}

function Metric({ label, value, styles }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function previewCards() {
  return PREVIEW_RECOMMENDATIONS.map((recommendation) => ({
    recommendation,
    item: PREVIEW_MENU.find((item) => item.id === recommendation.menuItemId),
  }));
}

function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString() : Number(value).toFixed(1);
}

const createStyles = (colors) => StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: 24, paddingTop: spacing.md },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brand: { color: colors.text, fontFamily, fontSize: 15, fontWeight: "700" },
  backButton: { justifyContent: "center", minHeight: 44, paddingLeft: spacing.md },
  backText: { color: colors.muted, fontFamily, fontSize: 12, fontWeight: "700" },
  hero: { marginTop: 48 },
  eyebrow: { color: colors.accent, fontFamily, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.text, fontFamily, fontSize: 34, fontWeight: "800", letterSpacing: -1.1, lineHeight: 39, marginTop: spacing.md },
  copy: { color: colors.muted, fontFamily, fontSize: 14, lineHeight: 21, marginTop: spacing.md, maxWidth: 330 },
  previewNote: { color: colors.muted, fontFamily, fontSize: 12, lineHeight: 18, marginTop: spacing.lg },
  state: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.xl, padding: spacing.xl },
  stateTitle: { color: colors.text, fontFamily, fontSize: 17, fontWeight: "800", textAlign: "center" },
  stateText: { color: colors.muted, fontFamily, fontSize: 13, lineHeight: 19, marginTop: spacing.sm, textAlign: "center" },
  retryButton: { alignItems: "center", borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, justifyContent: "center", marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.xl },
  retryText: { color: colors.text, fontFamily, fontSize: 13, fontWeight: "800" },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  cardTopLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rank: { color: colors.accent, fontFamily, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  stall: { color: colors.muted, flex: 1, fontFamily, fontSize: 11, marginLeft: spacing.md, textAlign: "right" },
  mealName: { color: colors.text, fontFamily, fontSize: 20, fontWeight: "800", letterSpacing: -0.3, lineHeight: 26, marginTop: spacing.md },
  reason: { color: colors.muted, fontFamily, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  nutritionRow: { flexDirection: "row", marginTop: spacing.lg },
  metric: { flex: 1 },
  metricDivider: { backgroundColor: colors.line, marginHorizontal: spacing.lg, width: 1 },
  metricLabel: { color: colors.muted, fontFamily, fontSize: 11 },
  metricValue: { color: colors.text, fontFamily, fontSize: 14, fontWeight: "800", marginTop: spacing.xs },
  warning: { color: colors.warningText, fontFamily, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: spacing.lg },
  source: { color: colors.muted, fontFamily, fontSize: 11, lineHeight: 17, marginTop: spacing.lg },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
