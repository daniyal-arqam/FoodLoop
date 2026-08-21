import { useEffect, useRef, useState } from "react";
import { config } from "../../config/env.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { errorMessage } from "../../utils/errors.js";
import { USER_ROLES } from "../../utils/constants.js";

export function GoogleSignIn({ role = USER_ROLES.PROVIDER, onSignedIn }) {
  const hostRef = useRef(null);
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = config.googleClientId;

  useEffect(() => {
    if (!clientId) {
      return undefined;
    }
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return undefined;
    }
    const existing = document.querySelector("script[data-google-gsi]");
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return undefined;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
    return undefined;
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !clientId || !hostRef.current || !window.google?.accounts?.id) {
      return undefined;
    }

    hostRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const user = await loginWithGoogle({
            idToken: response.credential,
            role,
          });
          onSignedIn?.(user);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
    window.google.accounts.id.renderButton(hostRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 320,
    });
    return undefined;
  }, [scriptReady, clientId, loginWithGoogle, onSignedIn, role, toast]);

  if (!clientId) {
    return (
      <p className="muted google-signin-hint" role="status">
        Continue with Google needs a Google client ID on this deployment.
      </p>
    );
  }

  return <div className="google-sign-in" ref={hostRef} />;
}
