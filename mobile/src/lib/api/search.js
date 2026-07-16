export async function searchMeals(
  query,
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  const mealRequest = typeof query === "string" ? query.trim() : "";
  if (!mealRequest) {
    throw new Error("A meal request is required.");
  }
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }

  const response = await fetchImpl(
    `${baseUrl.replace(/\/$/, "")}/search?query=${encodeURIComponent(mealRequest)}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error("Could not search stored Techno Edge meals. Try again.");
  }
  return response.json();
}
