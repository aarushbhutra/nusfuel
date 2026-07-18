export async function authenticate(
  mode,
  credentials,
  { baseUrl, fetchImpl = globalThis.fetch } = {},
) {
  if (mode !== "register" && mode !== "login") {
    throw new Error("Choose sign in or create account.");
  }
  if (!baseUrl) {
    throw new Error("Set EXPO_PUBLIC_API_BASE_URL before signing in.");
  }

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/auth/${mode}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Could not authenticate. Try again.");
  }
  return response.json();
}
