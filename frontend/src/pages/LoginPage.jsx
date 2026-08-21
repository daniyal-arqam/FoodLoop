import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { errorMessage } from "../utils/errors.js";
import { postAuthPath } from "../utils/roles.js";
import { DEMO_ACCOUNT_LIST } from "../utils/demoAccounts.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/FormFields.jsx";
import { Button } from "../components/ui/Button.jsx";

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const currentUser = await login(form);
      toast.success("Signed in");
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
    <Card title="Welcome back" className="page-narrow">
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
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="muted">
          Admins sign in here. New providers and organizations can <Link to="/register">create an account</Link>.
        </p>
      </form>
      <div className="demo-accounts">
        <p className="muted">Hackathon demo accounts (after `./scripts/seed-demo.sh`)</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {DEMO_ACCOUNT_LIST.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="ghost"
              onClick={() => setForm({ email: account.email, password: account.password })}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
