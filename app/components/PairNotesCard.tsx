"use client";

import { type FormEvent, useEffect, useState } from "react";

type PairNotesSettings = {
  email: string | null;
  emailVerified: boolean;
  weeklyEmailEnabled: boolean;
  emailTimezone: string;
  active: boolean;
};

type DashboardResponse = { pairNotes?: PairNotesSettings };

const emptySettings: PairNotesSettings = {
  email: null,
  emailVerified: false,
  weeklyEmailEnabled: false,
  emailTimezone: "America/New_York",
  active: false,
};

export default function PairNotesCard({
  signedIn,
  partnerName,
  partnerHasResults,
}: {
  signedIn: boolean;
  partnerName: string | null;
  partnerHasResults: boolean;
}) {
  const [settings, setSettings] = useState<PairNotesSettings>(emptySettings);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [loading, setLoading] = useState(signedIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/me")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: DashboardResponse) => {
        const next = data.pairNotes ?? emptySettings;
        setSettings(next);
        setEmail(next.email ?? "");
        setEnabled(next.weeklyEmailEnabled);
        setTimezone(next.emailTimezone);
        if (new URLSearchParams(window.location.search).get("pair-notes") === "verified") {
          setMessage("Your email is confirmed. PAIR Notes are ready.");
        }
      })
      .catch(() => setMessage("We could not load your email settings."))
      .finally(() => setLoading(false));
  }, [signedIn]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/pair-notes/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, weeklyEmailEnabled: enabled, emailTimezone: timezone }),
      });
      const data = await response.json() as {
        error?: string;
        pairNotes?: PairNotesSettings;
        verificationSent?: boolean;
      };
      if (!response.ok || !data.pairNotes) throw new Error(data.error ?? "Please try again.");
      setSettings(data.pairNotes);
      setEmail(data.pairNotes.email ?? "");
      setEnabled(data.pairNotes.weeklyEmailEnabled);
      setTimezone(data.pairNotes.emailTimezone);
      if (!data.pairNotes.weeklyEmailEnabled) setMessage("PAIR Notes are turned off.");
      else if (data.pairNotes.active) setMessage("PAIR Notes are on. Your next note will arrive Monday morning.");
      else if (data.verificationSent) setMessage("Check your inbox and confirm your email to turn on PAIR Notes.");
      else setMessage("Saved. Email delivery will begin after your address is confirmed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const status = settings.active
    ? "Active - Mondays"
    : settings.weeklyEmailEnabled && settings.email
      ? "Verification needed"
      : settings.email
        ? "Email saved"
        : "Not set up";

  return (
    <section className="pair-notes-section" id="pair-notes">
      <div className="pair-notes-copy">
        <p className="section-kicker">PAIR Notes</p>
        <h2>One thoughtful nudge.<br /><em>A better week together.</em></h2>
        <p>Each Monday, Relatune can send one practical way to support your partner, chosen from their saved personality results. Notes rotate so the care stays fresh.</p>
        <div className="pair-note-preview" aria-label="Example weekly PAIR Note">
          <span>This week's note</span>
          <strong>{partnerName ? `A small way to care for ${partnerName}` : "A small way to care this week"}</strong>
          <p>Notice one task that would lighten their load, then take it off their plate without making them manage the help.</p>
        </div>
      </div>

      <article className="pair-notes-card">
        <div className="pair-notes-card-head">
          <div><p className="card-kicker">Email settings</p><h3>Your Monday care note</h3></div>
          <span className={`status-pill ${settings.active ? "active" : ""}`}>{status}</span>
        </div>
        {!signedIn ? (
          <div className="pair-notes-signed-out">
            <p>Sign in to add your email and choose whether to receive weekly PAIR Notes.</p>
            <a className="primary-button dark" href="/login">Create an account</a>
          </div>
        ) : loading ? (
          <p className="settings-loading">Loading your settings...</p>
        ) : (
          <form className="pair-notes-form" onSubmit={save}>
            <label htmlFor="pair-notes-email">Email address</label>
            <input id="pair-notes-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required={enabled} placeholder="you@example.com" />
            <label className="check-row" htmlFor="pair-notes-enabled">
              <input id="pair-notes-enabled" type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span>Send me one PAIR Note each Monday at about 8:00 AM.</span>
            </label>
            {enabled && (
              <label className="timezone-field" htmlFor="pair-notes-timezone">
                Delivery time zone
                <select id="pair-notes-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </select>
              </label>
            )}
            {!partnerHasResults && <p className="settings-note">Your first personalized note will wait until your partner connects and saves a quiz result.</p>}
            {message && <p className="settings-message" role="status">{message}</p>}
            <button className="primary-button dark" type="submit" disabled={saving}>{saving ? "Saving..." : "Save email settings"}</button>
            <small>Your email stays private, is never shown to your partner, and can be unsubscribed at any time.</small>
          </form>
        )}
      </article>
    </section>
  );
}
