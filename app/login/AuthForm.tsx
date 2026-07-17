"use client";

import { type FormEvent, useState } from "react";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [weeklyEmailEnabled, setWeeklyEmailEnabled] = useState(false);
  const [emailTimezone, setEmailTimezone] = useState("America/New_York");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mode === "register" && password !== confirmPassword) {
      setMessage("Those passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, email, weeklyEmailEnabled, emailTimezone }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Please try again.");
      window.location.assign("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Account options">
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Create account</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} required />
          {mode === "register" && <small>3–24 letters, numbers, dots, dashes, or underscores.</small>}
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="email">Email for PAIR Notes</label>
            <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required={weeklyEmailEnabled} />
            <small>Optional. Your email is private and is never shown to your partner.</small>
          </div>
        )}
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
          {mode === "register" && <small>Use at least 12 characters and a password you do not reuse.</small>}
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} required />
          </div>
        )}
        {message && <p className="auth-message" role="alert">{message}</p>}
        {mode === "register" && (
          <div className="weekly-opt-in">
            <label className="check-row" htmlFor="weekly-email-enabled">
              <input id="weekly-email-enabled" type="checkbox" checked={weeklyEmailEnabled} onChange={(event) => setWeeklyEmailEnabled(event.target.checked)} />
              <span>Send me one personalized PAIR Note each Monday.</span>
            </label>
            {weeklyEmailEnabled && (
              <label className="timezone-field" htmlFor="email-timezone">
                Delivery time zone
                <select id="email-timezone" value={emailTimezone} onChange={(event) => setEmailTimezone(event.target.value)}>
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </select>
              </label>
            )}
            <small>We will ask you to verify your email. You can unsubscribe at any time.</small>
          </div>
        )}
        <button className="primary-button auth-submit" disabled={submitting} type="submit">
          {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create my account"}
        </button>
      </form>
      <p className="auth-privacy">Passwords are securely hashed and never stored in readable form.</p>
    </div>
  );
}
