export async function postMealLog(
  mealLog,
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/meal-logs`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(mealLog),
  });

  if (!response.ok) {
    throw new Error("Could not log this meal. Try again.");
  }
  return response.json();
}

export async function getProgress(
  period = "daily",
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }
  if (period !== "daily" && period !== "weekly") {
    throw new Error("Progress period must be daily or weekly.");
  }

  const response = await fetchImpl(
    `${baseUrl.replace(/\/$/, "")}/progress?period=${period}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error("Could not load your progress. Try again.");
  }
  return response.json();
}
