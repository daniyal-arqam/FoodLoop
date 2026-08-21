import { TOKEN_STORAGE_KEY } from "../utils/constants.js";

let memoryToken = null;

function sessionStore() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function localStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Access tokens live in memory and sessionStorage only.
 * The client never decodes JWT claims for authorization — GET /api/auth/me is the source of truth.
 * Tokens are sent only as an Authorization Bearer header, never in URLs or request bodies.
 */
export function getAccessToken() {
  if (memoryToken) {
    return memoryToken;
  }

  const session = sessionStore()?.getItem(TOKEN_STORAGE_KEY);
  const migrated = session || localStore()?.getItem(TOKEN_STORAGE_KEY);
  if (migrated) {
    memoryToken = migrated;
    sessionStore()?.setItem(TOKEN_STORAGE_KEY, migrated);
    localStore()?.removeItem(TOKEN_STORAGE_KEY);
  }
  return memoryToken;
}

export function setAccessToken(token) {
  memoryToken = token || null;
  const session = sessionStore();
  const local = localStore();
  if (!memoryToken) {
    session?.removeItem(TOKEN_STORAGE_KEY);
    local?.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  session?.setItem(TOKEN_STORAGE_KEY, memoryToken);
  local?.removeItem(TOKEN_STORAGE_KEY);
}

export function clearAccessToken() {
  setAccessToken(null);
}

export function resetTokenStore() {
  memoryToken = null;
}
