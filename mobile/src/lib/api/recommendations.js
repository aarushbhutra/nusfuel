export async function getRecommendations(
  period = "daily",
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }
  if (period !== "daily" && period !== "weekly") {
    throw new Error("Recommendation period must be daily or weekly.");
  }

  const response = await fetchImpl(
    `${baseUrl.replace(/\/$/, "")}/recommendations?period=${period}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error("Could not load recommendations. Try again.");
  }
  return response.json();
}
