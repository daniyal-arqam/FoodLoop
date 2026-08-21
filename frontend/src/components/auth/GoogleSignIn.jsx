import { useCallback, useEffect, useState } from "react";
import { config } from "../../config/env.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { errorMessage } from "../../utils/errors.js";
import { USER_ROLES } from "../../utils/constants.js";

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.26-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

async function resolveGoogleClientId() {
  if (config.googleClientId) {
    return config.googleClientId;
  }
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/auth/google/config`);
    const payload = await response.json();
    return String(payload?.data?.clientId || "").trim();
  } catch {
    return "";
  }
}

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  const existing = document.querySelector("script[data-google-gsi]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not load."));
    document.head.appendChild(script);
  });
}

export function GoogleSignIn({ role = USER_ROLES.PROVIDER, onSignedIn }) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [clientId, setClientId] = useState(config.googleClientId || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveGoogleClientId().then((id) => {
      if (!cancelled && id) {
        setClientId(id);
      }
    });
    loadGoogleScript().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCredential = useCallback(
    async (response) => {
      setBusy(true);
      try {
        const user = await loginWithGoogle({
          idToken: response.credential,
          role,
        });
        onSignedIn?.(user);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [loginWithGoogle, onSignedIn, role, toast]
  );

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const id = clientId || (await resolveGoogleClientId());
      if (id && !clientId) {
        setClientId(id);
      }
      if (!id) {
        toast.error("Google isn’t connected here yet. Sign in with email for now.");
        return;
      }
      await loadGoogleScript();
      if (!window.google?.accounts?.id) {
        toast.error("Google is still waking up. Try once more in a second.");
        return;
      }
      window.google.accounts.id.initialize({
        client_id: id,
        callback: handleCredential,
        ux_mode: "popup",
        context: "signin",
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          toast.error("Google popup was blocked. Allow popups, then try again.");
        }
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-google" onClick={handleClick} disabled={busy} aria-busy={busy}>
      <GoogleMark />
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
