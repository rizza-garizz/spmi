export const AUTH_SESSION_KEY = "spmi_auth_session";
export const LOCAL_USER_KEY = "spmi_local_user";
export const AUTH_TOKEN_COOKIE = "spmi_auth_token";

export type AuthSession = {
  token?: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  roles?: string[];
  isLocal?: boolean;
  rememberMe?: boolean;
  expiresAt?: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function hasApiBaseUrl() {
  return Boolean(apiBaseUrl);
}

export function getApiUrl(path: string) {
  if (!apiBaseUrl) {
    return null;
  }

  return `${apiBaseUrl}${path}`;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(AUTH_SESSION_KEY) ??
    window.sessionStorage.getItem(AUTH_SESSION_KEY) ??
    window.localStorage.getItem(LOCAL_USER_KEY) ??
    window.sessionStorage.getItem(LOCAL_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return readAuthSession()?.token ?? window.localStorage.getItem("spmi_token") ?? window.sessionStorage.getItem("spmi_token") ?? null;
}

export function getLegacyUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("spmi_user") ?? window.sessionStorage.getItem("spmi_user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession["user"];
  } catch {
    return null;
  }
}

export function hasAnySession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    readAuthSession() ||
      window.localStorage.getItem(AUTH_SESSION_KEY) ||
      window.sessionStorage.getItem(AUTH_SESSION_KEY) ||
      window.localStorage.getItem(LOCAL_USER_KEY) ||
      window.sessionStorage.getItem(LOCAL_USER_KEY) ||
      window.localStorage.getItem("spmi_token") ||
      window.sessionStorage.getItem("spmi_token")
  );
}

export function parseApiPayload<T>(payload: unknown, fallback: T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return ((payload as { data?: T }).data ?? fallback) as T;
  }

  return (payload as T) ?? fallback;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(AUTH_SESSION_KEY);
    storage.removeItem(LOCAL_USER_KEY);
    storage.removeItem("spmi_token");
    storage.removeItem("spmi_user");
  });
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function saveAuthSession(session: AuthSession, options: { rememberMe?: boolean } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const rememberMe = options.rememberMe ?? session.rememberMe ?? false;
  const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const nextSession = {
    ...session,
    rememberMe,
    expiresAt: session.expiresAt ?? new Date(Date.now() + ttlMs).toISOString(),
  };
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(AUTH_SESSION_KEY);
  otherStorage.removeItem("spmi_token");
  otherStorage.removeItem("spmi_user");
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));

  if (nextSession.token) {
    const maxAgeSeconds = Math.max(60, Math.floor((new Date(nextSession.expiresAt).getTime() - Date.now()) / 1000));
    document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(nextSession.token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
}

export function saveLocalSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_USER_KEY);
  window.sessionStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session));
}

export function dispatchAppEvent(name: "spmi-session-changed" | "spmi-data-changed") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(name));
}

export async function clientApiRequest(path: string, init: RequestInit = {}) {
  const url = getApiUrl(path);
  if (!url) {
    throw new Error("API base URL not configured.");
  }

  const headers = new Headers(init.headers);
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  return response;
}
