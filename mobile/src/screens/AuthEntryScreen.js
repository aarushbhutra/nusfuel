import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function AuthEntryScreen({ apiBaseUrl, onAuthenticated }) {
  const { styles } = useTheme(createStyles);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await onAuthenticated({ mode, email, password });
    } catch (authenticationError) {
      setError(authenticationError instanceof Error ? authenticationError.message : "Could not authenticate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <View style={styles.brandDot} />
              </View>
              <Text style={styles.brand}>NUSFuel</Text>
            </View>
            <Text style={styles.fieldNote}>FIELD NOTE 01</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>NUS / TECHNO EDGE</Text>
            <Text style={styles.title}>Eat with a plan.</Text>
            <Text style={styles.copy}>
              Sign in to keep a daily target and your Techno Edge meal logs in one place.
            </Text>
            <View style={styles.editorialMark}>
              <View style={styles.editorialDot} />
              <View style={styles.editorialRule} />
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>{mode === "register" ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</Text>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@u.nus.edu"
              style={styles.input}
              value={email}
            />
            <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              style={styles.input}
              value={password}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!apiBaseUrl ? <Text style={styles.error}>Set EXPO_PUBLIC_API_BASE_URL before signing in.</Text> : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === "register" ? "Create NUSFuel account" : "Sign in to NUSFuel"}
            disabled={loading || !apiBaseUrl}
            onPress={submit}
            style={({ pressed }) => [styles.button, (loading || !apiBaseUrl) && styles.buttonDisabled, pressed && styles.pressed]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === "register" ? "Create account" : "Sign in"}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setMode((current) => current === "register" ? "login" : "register"); setError(""); }} style={styles.modeButton}>
            <Text style={styles.helper}>{mode === "register" ? "Already have an account? Sign in" : "New to NUSFuel? Create an account"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  brandDot: {
    backgroundColor: colors.accentText,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  brand: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  fieldNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  hero: {
    marginTop: 64,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 39,
    fontWeight: "800",
    letterSpacing: -1.4,
    lineHeight: 43,
    marginTop: spacing.md,
    maxWidth: 300,
  },
  copy: {
    color: colors.muted,
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.lg,
    maxWidth: 330,
  },
  editorialMark: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  editorialDot: {
    backgroundColor: colors.accent,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  editorialRule: {
    backgroundColor: colors.line,
    height: 1,
    marginLeft: spacing.sm,
    width: 72,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: 36,
    padding: spacing.lg,
  },
  previewLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  input: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.text,
    fontFamily,
    fontSize: 15,
    marginTop: spacing.md,
    minHeight: 48,
    paddingHorizontal: 0,
  },
  inputLabel: {
    color: colors.text,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  inputLabelSpaced: {
    marginTop: spacing.md,
  },
  error: {
    color: colors.warningText,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radiusLarge,
    justifyContent: "center",
    minHeight: 56,
  },
  buttonText: {
    color: colors.accentText,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modeButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    minHeight: 32,
  },
  helper: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
