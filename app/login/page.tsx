import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Relatune",
  description: "Sign in or create your private Relatune account.",
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/"><span className="brand-mark">R</span><span>Relatune</span></Link>
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="section-kicker">Your private space for two</p>
          <h1>Come back to<br /><em>what you’ve learned.</em></h1>
          <p>Create one account for you and another for your partner. Connect them with a private six-character code.</p>
          <Link className="secondary-link" href="/">Browse the quizzes first</Link>
        </div>
        <AuthForm />
      </section>
    </main>
  );
}
