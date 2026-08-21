import { useTheme } from "../../hooks/useTheme.js";
import { Button } from "./Button.jsx";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button
      className="btn-icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </Button>
  );
}
