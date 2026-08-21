import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { errorMessage } from "../utils/errors.js";
import { postAuthPath } from "../utils/roles.js";
import { USER_ROLES } from "../utils/constants.js";
import { Card } from "../components/ui/Card.jsx";
import { Input, Select } from "../components/ui/FormFields.jsx";
import { Button } from "../components/ui/Button.jsx";
import { GoogleSignIn } from "../components/auth/GoogleSignIn.jsx";

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [googleRole, setGoogleRole] = useState(USER_ROLES.PROVIDER);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const currentUser = await login(form);
      toast.success("Welcome back");
      navigate(postAuthPath(currentUser, location.state?.from), { replace: true });
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Welcome back" className="page-narrow auth-card">
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Signing you in…" : "Sign in"}
        </Button>
      </form>
      <div className="auth-divider">
        <span>or</span>
      </div>
      <Select
        id="google-role"
        label="I use FoodLoop as"
        value={googleRole}
        onChange={(event) => setGoogleRole(event.target.value)}
      >
        <option value={USER_ROLES.PROVIDER}>Someone with leftover food</option>
        <option value={USER_ROLES.ORGANIZATION}>Someone who collects food for a community</option>
      </Select>
      <GoogleSignIn
        role={googleRole}
        onSignedIn={(currentUser) => {
          toast.success("You’re in");
          navigate(postAuthPath(currentUser, location.state?.from), { replace: true });
        }}
      />
      <p className="muted">
        New here? <Link to="/register">Make an account</Link>.
      </p>
    </Card>
  );
}
