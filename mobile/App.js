import { useState } from "react";

import AuthEntryScreen from "./src/screens/AuthEntryScreen.js";
import GoalSetupScreen from "./src/screens/GoalSetupScreen.js";
import HomeScreen from "./src/screens/HomeScreen.js";
import MealDetailScreen from "./src/screens/MealDetailScreen.js";
import MenuBrowseScreen from "./src/screens/MenuBrowseScreen.js";
import ProgressScreen from "./src/screens/ProgressScreen.js";
import RecommendationsScreen from "./src/screens/RecommendationsScreen.js";
import { AppFrame } from "./src/components/AppNavigation.js";
import { authenticate } from "./src/lib/api/auth.js";
import { apiBaseUrl as configuredApiBaseUrl } from "./src/lib/config.js";
import { putGoal } from "./src/lib/api/goals.js";
import { postMealLog } from "./src/lib/api/progress.js";
import { useReducedMotion } from "./src/lib/useReducedMotion.js";

export default function App({ apiBaseUrl = configuredApiBaseUrl }) {
  const reducedMotion = useReducedMotion();
  const [authSession, setAuthSession] = useState(null);
  const [savedGoal, setSavedGoal] = useState(null);
  const [screen, setScreen] = useState("home");
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
            const result = await postMealLog(
              { menuItemId: selectedMenuItem.id, servingQuantity },
              { accessToken: authSession.accessToken, baseUrl: apiBaseUrl },
            );
            return result;
          }}
          onViewProgress={() => setScreen("progress")}
        />
      );
    }
    let activeScreen;
    if (screen === "menu") {
      activeScreen = (
        <MenuBrowseScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          onSelect={(item) => {
            setSelectedMenuItem(item);
            setDetailBackScreen("menu");
            setScreen("detail");
          }}
        />
      );
    }
    if (screen === "progress") {
      activeScreen = (
        <ProgressScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          goal={savedGoal}
          reducedMotion={reducedMotion}
        />
      );
    }
    if (screen === "recommendations") {
      activeScreen = (
        <RecommendationsScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          onSelect={(item) => {
            setSelectedMenuItem(item);
            setDetailBackScreen("recommendations");
            setScreen("detail");
          }}
        />
      );
    }
    if (!activeScreen) {
      activeScreen = (
        <HomeScreen
          apiBaseUrl={apiBaseUrl}
          authSession={authSession}
          goal={savedGoal}
          onBrowse={() => setScreen("menu")}
          onProgress={() => setScreen("progress")}
          onRecommendations={() => setScreen("recommendations")}
          onEdit={() => {
            setScreen("home");
            setSelectedMenuItem(null);
            setDetailBackScreen("menu");
            setSavedGoal(null);
          }}
        />
      );
    }
    return (
      <AppFrame
        activeTab={screen}
        onNavigate={(nextScreen) => {
          setSelectedMenuItem(null);
          setScreen(nextScreen);
        }}
      >
        {activeScreen}
      </AppFrame>
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
