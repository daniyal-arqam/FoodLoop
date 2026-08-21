import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginAccount, loginWithGoogleAccount, logoutAccount, registerAccount } from "../services/authService.js";
import { onUnauthorized } from "../services/apiClient.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "../services/tokenStore.js";
import { ApiError, errorMessage } from "../utils/errors.js";
import { PUBLIC_REGISTRATION_ROLES } from "../utils/constants.js";
import { hasRole as userHasRole } from "../utils/roles.js";

const AuthContext = createContext(null);

function applySession(user, accessToken) {
  setAccessToken(accessToken);
  return user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(clearSession);
    return () => onUnauthorized(null);
  }, [clearSession]);

  const refreshCurrentUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    const payload = await fetchCurrentUser();
    const currentUser = payload.data?.user || null;
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await refreshCurrentUser();
        if (cancelled) return;
        if (!currentUser) {
          clearSession();
        }
      } catch (error) {
        if (!cancelled && (error.status === 401 || error.status === 403)) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshCurrentUser]);

  const login = useCallback(async ({ email, password }) => {
    const payload = await loginAccount({ email, password });
    const currentUser = applySession(payload.data.user, payload.data.accessToken);
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      throw new ApiError("Admin registration is not publicly available", 403);
    }
    const payload = await registerAccount({ name, email, password, role });
    const currentUser = applySession(payload.data.user, payload.data.accessToken);
    setUser(currentUser);
    return currentUser;
  }, []);

  const loginWithGoogle = useCallback(async ({ idToken, role }) => {
    const payload = await loginWithGoogleAccount({ idToken, role });
    const currentUser = applySession(payload.data.user, payload.data.accessToken);
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await logoutAccount();
      }
    } catch {
      /* token already invalid */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      register,
      logout,
      refreshCurrentUser,
      hasRole: (roles) => userHasRole(user, roles),
      errorMessage,
    }),
    [user, loading, login, loginWithGoogle, register, logout, refreshCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
