import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { errorMessage } from "../utils/errors.js";
import { PUBLIC_REGISTRATION_ROLES, USER_ROLES } from "../utils/constants.js";
import { postAuthPath } from "../utils/roles.js";
import { Card } from "../components/ui/Card.jsx";
import { Input, Select } from "../components/ui/FormFields.jsx";
import { Button } from "../components/ui/Button.jsx";

const ROLE_LABELS = {
  [USER_ROLES.PROVIDER]: "Provider",
  [USER_ROLES.ORGANIZATION]: "Organization",
};

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: USER_ROLES.PROVIDER,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const currentUser = await register(form);
      toast.success("Account created");
      navigate(postAuthPath(currentUser), { replace: true });
      return currentUser;
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Join FoodLoop" className="page-narrow">
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <Input
          id="name"
          label="Name"
          autoComplete="name"
          required
          minLength={2}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <Select
          id="role"
          label="Role"
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          {PUBLIC_REGISTRATION_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Creating account…" : "Register"}
        </Button>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>. Admin accounts cannot be registered here.
        </p>
      </form>
    </Card>
  );
}
