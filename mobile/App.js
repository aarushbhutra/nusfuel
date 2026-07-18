import { useState } from "react";

import AuthEntryScreen from "./src/screens/AuthEntryScreen.js";
import GoalSavedScreen from "./src/screens/GoalSavedScreen.js";
import GoalSetupScreen from "./src/screens/GoalSetupScreen.js";
import MealDetailScreen from "./src/screens/MealDetailScreen.js";
import MenuBrowseScreen from "./src/screens/MenuBrowseScreen.js";
import ProgressScreen from "./src/screens/ProgressScreen.js";
import RecommendationsScreen from "./src/screens/RecommendationsScreen.js";
import { authenticate } from "./src/lib/api/auth.js";
import { apiBaseUrl as configuredApiBaseUrl } from "./src/lib/config.js";
import { putGoal } from "./src/lib/api/goals.js";
import { postMealLog } from "./src/lib/api/progress.js";
import { useReducedMotion } from "./src/lib/useReducedMotion.js";

export default function App({ apiBaseUrl = configuredApiBaseUrl }) {
  const reducedMotion = useReducedMotion();
  const [authSession, setAuthSession] = useState(null);
  const [savedGoal, setSavedGoal] = useState(null);
  const [screen, setScreen] = useState("saved");
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [detailBackScreen, setDetailBackScreen] = useState("menu");

  if (!authSession) {
    return (
      <AuthEntryScreen
        apiBaseUrl={apiBaseUrl}
        onAuthenticated={async ({ mode, email, password }) => {
          const session = await authenticate(mode, { email, password }, { baseUrl: apiBaseUrl });
          setAuthSession(session);
        }}
      />
    );
  }

  if (savedGoal) {
    if (screen === "detail" && selectedMenuItem) {
      return (
        <MealDetailScreen
          item={selectedMenuItem}
          onBack={() => setScreen(detailBackScreen)}
          backLabel={detailBackScreen === "recommendations" ? "Back to recommendations" : "Back to menu"}
          onLog={async (servingQuantity) => {
            return postMealLog(
              { menuItemId: selectedMenuItem.id, servingQuantity },
              { accessToken: authSession.accessToken, baseUrl: apiBaseUrl },
            );
          }}
          onViewProgress={() => setScreen("progress")}
        />
      );
    }
    if (screen === "menu") {
      return (
        <MenuBrowseScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          onBack={() => setScreen("saved")}
          onSelect={(item) => {
            setSelectedMenuItem(item);
            setDetailBackScreen("menu");
            setScreen("detail");
          }}
        />
      );
    }
    if (screen === "progress") {
      return (
        <ProgressScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          goal={savedGoal}
          onBack={() => setScreen("saved")}
          reducedMotion={reducedMotion}
        />
      );
    }
    if (screen === "recommendations") {
      return (
        <RecommendationsScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          onBack={() => setScreen("saved")}
          onSelect={(item) => {
            setSelectedMenuItem(item);
            setDetailBackScreen("recommendations");
            setScreen("detail");
          }}
        />
      );
    }
    return (
      <GoalSavedScreen
        goal={savedGoal}
        onBrowse={() => setScreen("menu")}
        onProgress={() => setScreen("progress")}
        onRecommendations={() => setScreen("recommendations")}
        reducedMotion={reducedMotion}
        onEdit={() => {
          setScreen("saved");
          setSelectedMenuItem(null);
          setDetailBackScreen("menu");
          setSavedGoal(null);
        }}
      />
    );
  }

  return (
    <GoalSetupScreen
      onSave={async (goal) => {
        const saved = await putGoal(goal, {
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        });
        setSavedGoal(saved);
      }}
    />
  );
}
