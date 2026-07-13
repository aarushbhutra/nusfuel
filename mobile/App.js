import { useState } from "react";

import AuthEntryScreen from "./src/screens/AuthEntryScreen.js";
import GoalSavedScreen from "./src/screens/GoalSavedScreen.js";
import GoalSetupScreen from "./src/screens/GoalSetupScreen.js";
import MealDetailScreen from "./src/screens/MealDetailScreen.js";
import MenuBrowseScreen from "./src/screens/MenuBrowseScreen.js";
import { putGoal } from "./src/lib/api/goals.js";

export default function App({ authSession = null, apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [savedGoal, setSavedGoal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  if (!authenticated) {
    return <AuthEntryScreen onContinue={() => setAuthenticated(true)} />;
  }

  if (savedGoal) {
    if (menuOpen && selectedMenuItem) {
      return <MealDetailScreen item={selectedMenuItem} onBack={() => setSelectedMenuItem(null)} />;
    }
    if (menuOpen) {
      return (
        <MenuBrowseScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          onBack={() => setMenuOpen(false)}
          onSelect={setSelectedMenuItem}
        />
      );
    }
    return (
      <GoalSavedScreen
        goal={savedGoal}
        onBrowse={() => setMenuOpen(true)}
        onEdit={() => {
          setMenuOpen(false);
          setSelectedMenuItem(null);
          setSavedGoal(null);
        }}
      />
    );
  }

  return (
    <GoalSetupScreen
      onSave={async (goal) => {
        if (apiBaseUrl && authSession?.accessToken) {
          const saved = await putGoal(goal, {
            accessToken: authSession.accessToken,
            baseUrl: apiBaseUrl,
          });
          setSavedGoal(saved);
          return;
        }

        // ponytail: preview-only local save; replace with Cognito session wiring before production auth.
        setSavedGoal(goal);
      }}
    />
  );
}
