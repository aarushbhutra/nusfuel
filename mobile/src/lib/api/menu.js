export async function getMenu(
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  return requestMenu("/menu", { baseUrl, accessToken, fetchImpl });
}

export async function getMenuItem(
  itemId,
  { baseUrl, accessToken, fetchImpl = globalThis.fetch } = {},
) {
  if (!itemId) {
    throw new Error("A menu item is required.");
  }
  return requestMenu(`/menu/${encodeURIComponent(itemId)}`, {
    baseUrl,
    accessToken,
    fetchImpl,
  });
}

async function requestMenu(path, { baseUrl, accessToken, fetchImpl }) {
  if (!baseUrl || !accessToken) {
    throw new Error("A signed-in API session is required.");
  }

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Could not load the Techno Edge menu. Try again.");
  }
  return response.json();
}
