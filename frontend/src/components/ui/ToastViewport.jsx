import { useToast } from "../../hooks/useToast.js";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p style={{ margin: 0 }}>{toast.message}</p>
            <button type="button" className="btn btn-ghost" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
