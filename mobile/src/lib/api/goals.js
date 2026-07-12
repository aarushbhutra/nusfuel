export async function putGoal(
  goal,
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/goals`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(goal),
  });

  if (!response.ok) {
    throw new Error("Could not save your target. Try again.");
  }
  return response.json();
}
