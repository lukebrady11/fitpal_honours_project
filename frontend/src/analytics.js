const GUEST_ID_KEY = "fitpal_guest_id_v1";

export function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function logEvent(apiBase, { type, isLoggedIn, meta }) {
  try {
    const endpoint = isLoggedIn ? "/events/auth" : "/events";
    const body = isLoggedIn
      ? { type, meta }
      : { type, guestId: getGuestId(), meta };

    await fetch(`${apiBase}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    // never crash the app because analytics failed
  }
}
