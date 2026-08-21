import { LoadingState } from "../ui/States.jsx";

export function AuthLoading({ label = "Checking session…" }) {
  return <LoadingState label={label} />;
}
