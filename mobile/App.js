import { useState } from "react";

import AuthEntryScreen from "./src/screens/AuthEntryScreen.js";
import GoalSavedScreen from "./src/screens/GoalSavedScreen.js";
import GoalSetupScreen from "./src/screens/GoalSetupScreen.js";
import MealDetailScreen from "./src/screens/MealDetailScreen.js";
import MenuBrowseScreen from "./src/screens/MenuBrowseScreen.js";
import ProgressScreen from "./src/screens/ProgressScreen.js";
import RecommendationsScreen from "./src/screens/RecommendationsScreen.js";
import { putGoal } from "./src/lib/api/goals.js";
import { postMealLog } from "./src/lib/api/progress.js";
import { createPreviewMealLog } from "./src/lib/progress.js";

export default function App({ authSession = null, apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [savedGoal, setSavedGoal] = useState(null);
  const [screen, setScreen] = useState("saved");
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [detailBackScreen, setDetailBackScreen] = useState("menu");
  const [localLogs, setLocalLogs] = useState([]);

  if (!authenticated) {
    return <AuthEntryScreen onContinue={() => setAuthenticated(true)} />;
  }

  if (savedGoal) {
    if (screen === "detail" && selectedMenuItem) {
      return (
        <MealDetailScreen
          item={selectedMenuItem}
          onBack={() => setScreen(detailBackScreen)}
          backLabel={detailBackScreen === "recommendations" ? "Back to recommendations" : "Back to menu"}
          onLog={async (servingQuantity) => {
            if (apiBaseUrl && authSession?.accessToken) {
              return postMealLog(
                { menuItemId: selectedMenuItem.id, servingQuantity },
                { accessToken: authSession.accessToken, baseUrl: apiBaseUrl },
              );
            }
            const log = createPreviewMealLog(selectedMenuItem, servingQuantity);
            setLocalLogs((current) => [...current, log]);
            return log;
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
          logs={localLogs}
          onBack={() => setScreen("saved")}
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
        onEdit={() => {
          setScreen("saved");
          setSelectedMenuItem(null);
          setDetailBackScreen("menu");
          setLocalLogs([]);
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
