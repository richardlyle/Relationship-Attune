"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../auth";
import { quizzes, type Quiz, type ResultProfile } from "../lib/quizzes";
import PairNotesCard from "./PairNotesCard";

type SavedResult = {
  quizSlug: string;
  primaryType: string;
  quizTitle: string;
  profileTitle: string;
  summary: string;
  care: string[];
  completedAt: string;
  ownerName?: string;
};

type CoupleState = {
  inviteCode: string;
  partnerName: string | null;
  partnerResults: SavedResult[];
};

type DashboardData = {
  displayName: string;
  couple: CoupleState | null;
  results: SavedResult[];
};

const demoPartnerResult: SavedResult = {
  quizSlug: "jungian-16-type",
  primaryType: "INFJ",
  quizTitle: "Jungian 16-Type Explorer",
  profileTitle: "INFJ · Insightful Guide",
  summary: "They value depth, meaning, and emotional honesty, and often need solitude to process what they sense.",
  care: [
    "Make room for deep, unhurried conversation.",
    "Give solitude without treating it as distance.",
    "Be sincere—mixed signals are especially tiring.",
  ],
  completedAt: new Date().toISOString(),
  ownerName: "Your partner",
};

export default function RelationshipApp({ user }: { user: AuthUser | null }) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ key: string; profile: ResultProfile } | null>(null);
  const [results, setResults] = useState<SavedResult[]>([]);
  const [couple, setCouple] = useState<CoupleState | null>(
    user ? null : { inviteCode: "DEMO24", partnerName: "Your partner", partnerResults: [demoPartnerResult] },
  );
  const [displayName, setDisplayName] = useState(user?.displayName ?? "You");
  const [pairMode, setPairMode] = useState<"create" | "join" | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [pairMessage, setPairMessage] = useState("");
  const [loadingPair, setLoadingPair] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user) return;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: DashboardData) => {
        setDisplayName(data.displayName);
        setResults(data.results);
        setCouple(data.couple);
      })
      .catch(() => undefined);
  }, [user]);

  const categories = ["All", "Classic", "Research-based", "Relationship"];
  const shownQuizzes = useMemo(() => {
    if (filter === "All") return quizzes;
    const categoryMap: Record<string, string[]> = {
      Classic: ["Classic framework"],
      "Research-based": ["Research-based framework"],
      Relationship: ["Relationship framework"],
    };
    return quizzes.filter((quiz) => categoryMap[filter]?.includes(quiz.kicker));
  }, [filter]);

  const latestResult = results[0] ?? null;
  const partnerInsight = couple?.partnerResults?.[0] ?? null;

  function beginQuiz(quiz: Quiz) {
    setActiveQuiz(quiz);
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  function chooseAnswer(value: string) {
    if (!activeQuiz) return;
    const nextAnswers = [...answers, value];
    setAnswers(nextAnswers);
    if (step < activeQuiz.questions.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    const scores = nextAnswers.reduce<Record<string, number>>((totals, answer) => {
      totals[answer] = (totals[answer] ?? 0) + 1;
      return totals;
    }, {});
    const primaryType = activeQuiz.scoring === "four-letter" && activeQuiz.dimensions
      ? activeQuiz.dimensions.map(([left, right]) => (scores[left] ?? 0) >= (scores[right] ?? 0) ? left : right).join("")
      : Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const profile = activeQuiz.profiles[primaryType];
    setResult({ key: primaryType, profile });

    const saved: SavedResult = {
      quizSlug: activeQuiz.slug,
      primaryType,
      quizTitle: activeQuiz.title,
      profileTitle: profile.title,
      summary: profile.summary,
      care: profile.care,
      completedAt: new Date().toISOString(),
      ownerName: displayName,
    };
    setResults((current) => [saved, ...current.filter((item) => item.quizSlug !== saved.quizSlug)]);

    if (user) {
      fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(saved),
      }).catch(() => undefined);
    }
  }

  async function createPair() {
    if (!user) {
      setCouple({ inviteCode: "US2DAY", partnerName: null, partnerResults: [] });
      setPairMessage("Demo code created. Create an account to make a real private space.");
      return;
    }
    setLoadingPair(true);
    setPairMessage("");
    try {
      const response = await fetch("/api/couple", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create your space.");
      setCouple(data.couple);
      setPairMessage("Your private code is ready to share.");
    } catch (error) {
      setPairMessage(error instanceof Error ? error.message : "Could not create your space.");
    } finally {
      setLoadingPair(false);
    }
  }

  async function joinPair() {
    if (joinCode.trim().length < 4) {
      setPairMessage("Enter the code your partner shared with you.");
      return;
    }
    if (!user) {
      setCouple({ inviteCode: joinCode.toUpperCase(), partnerName: "Your partner", partnerResults: [demoPartnerResult] });
      setPairMessage("Demo space connected. Create an account to save this pairing.");
      return;
    }
    setLoadingPair(true);
    setPairMessage("");
    try {
      const response = await fetch("/api/couple", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "join", code: joinCode.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not join that space.");
      setCouple(data.couple);
      setPairMessage("You’re connected. Your shared insights will appear here.");
    } catch (error) {
      setPairMessage(error instanceof Error ? error.message : "Could not join that space.");
    } finally {
      setLoadingPair(false);
    }
  }

  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Relatune home">
          <span className="brand-mark">R</span>
          <span>Relatune</span>
        </a>
        <div className="nav-links">
          <a href="#quizzes">Quizzes</a>
          <a href="#together">Together</a>
          <a href="#care-map">Care map</a>
          <a href="#pair-notes">PAIR Notes</a>
        </div>
        <div className="account-area">
          {user ? (
            <>
              <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
              <span className="account-name">{displayName}</span>
              <form action="/api/auth/logout" method="post"><button className="text-link signout-button" type="submit">Sign out</button></form>
            </>
          ) : (
            <a className="small-button" href="/login">Sign in</a>
          )}
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>♡</span> A private personality library for two</div>
          <h1>Know each other better.<br /><em>Love each other better.</em></h1>
          <p className="hero-text">Explore classic personality frameworks, save what you learn, and turn every result into a practical way to show up for each other.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => beginQuiz(quizzes[0])}>Take your first quiz <span>→</span></button>
            <a className="secondary-link" href="#together">Connect with your partner</a>
          </div>
          <div className="trust-row" aria-label="Site benefits">
            <span><b>6</b> free frameworks</span>
            <span><b>4–8</b> minutes each</span>
            <span><b>1</b> weekly PAIR Note</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="A sample partner care insight">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="profile-bubble profile-you"><span>Y</span><small>You</small></div>
          <div className="profile-bubble profile-partner"><span>♡</span><small>Partner</small></div>
          <article className="insight-card floating-card">
            <div className="insight-label">A small way to care today</div>
            <h3>Lower the temperature</h3>
            <p>Offer comfort first. Questions and plans can come after the nervous system settles.</p>
            <div className="try-this"><span>Try this</span> “You don’t have to solve this tonight. I’m here.”</div>
          </article>
          <div className="spark spark-one">✦</div>
          <div className="spark spark-two">·</div>
        </div>
      </section>

      <section className="quiz-section" id="quizzes">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Explore yourselves</p>
            <h2>Classic personality frameworks, made useful for two</h2>
          </div>
          <p>Original, free educational versions of recognizable frameworks—translated into relationship care.</p>
        </div>

        <div className="filter-row" role="tablist" aria-label="Quiz categories">
          {categories.map((category) => (
            <button
              key={category}
              className={filter === category ? "filter active" : "filter"}
              onClick={() => setFilter(category)}
              role="tab"
              aria-selected={filter === category}
            >{category}</button>
          ))}
        </div>

        <div className="quiz-grid">
          {shownQuizzes.map((quiz) => {
            const completed = results.find((item) => item.quizSlug === quiz.slug);
            return (
              <article className={`quiz-card accent-${quiz.accent}`} key={quiz.slug}>
                <div className="quiz-card-top">
                  <span className="quiz-icon">{quiz.icon}</span>
                  <span className="quiz-time">{completed ? "Completed" : quiz.time}</span>
                </div>
                <p className="card-kicker">{quiz.kicker}</p>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                {completed && <div className="result-pill">Your type: {completed.profileTitle}</div>}
                <button className="card-action" onClick={() => beginQuiz(quiz)}>
                  {completed ? "Retake quiz" : "Start quiz"} <span>↗</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="care-section" id="care-map">
        <div className="care-copy">
          <p className="section-kicker">Your care map</p>
          <h2>Insights that become<br /><em>something you can do.</em></h2>
          <p>Every result is translated into kind, practical guidance—so your partner never has to guess what support might look like.</p>
          {!latestResult && <button className="primary-button dark" onClick={() => beginQuiz(quizzes[2])}>Build my care map <span>→</span></button>}
        </div>
        <article className="care-map-card">
          {latestResult ? (
            <>
              <div className="care-map-head"><span className="mini-avatar">{displayName.slice(0, 1).toUpperCase()}</span><div><small>{displayName}’s latest insight</small><h3>{latestResult.profileTitle}</h3></div></div>
              <p>{latestResult.summary}</p>
              <div className="care-list">
                {latestResult.care.map((tip, index) => <div key={tip}><span>{index + 1}</span>{tip}</div>)}
              </div>
            </>
          ) : (
            <>
              <div className="care-map-head"><span className="mini-avatar">Y</span><div><small>Your results will live here</small><h3>A clearer care manual</h3></div></div>
              <p>Complete any quiz and this card becomes a simple, shareable guide to what helps you feel understood.</p>
              <div className="empty-lines"><span /><span /><span /></div>
            </>
          )}
        </article>
      </section>

      <PairNotesCard signedIn={Boolean(user)} partnerName={couple?.partnerName ?? null} partnerHasResults={Boolean(partnerInsight)} />

      <section className="together-section" id="together">
        <div className="together-heading">
          <p className="section-kicker">Better together</p>
          <h2>Two people. Two inner worlds.<br />One shared place to understand them.</h2>
        </div>

        <div className="together-grid">
          <article className="connect-card">
            <div className="connect-art"><span>{displayName.slice(0, 1).toUpperCase()}</span><i>＋</i><span className="soft">♡</span></div>
            <div>
              <p className="card-kicker">Your private space</p>
              <h3>{couple ? (couple.partnerName ? `Connected with ${couple.partnerName}` : "Invite your partner") : "Connect your two profiles"}</h3>
              <p>{couple ? `Your shared code is ${couple.inviteCode}. Only the two of you can use this space.` : "Create a code for your partner, or enter the code they sent you."}</p>
            </div>
            <div className="connect-actions">
              {!couple && <button className="primary-button dark" onClick={() => { setPairMode("create"); setPairMessage(""); }}>Create our space</button>}
              {!couple && <button className="outline-button" onClick={() => { setPairMode("join"); setPairMessage(""); }}>Enter a code</button>}
              {couple && <button className="code-button" onClick={() => navigator.clipboard?.writeText(couple.inviteCode)}><span>{couple.inviteCode}</span> Copy code</button>}
            </div>
          </article>

          <article className="partner-card">
            <div className="partner-card-head"><div><p className="card-kicker">From your partner’s care map</p><h3>{partnerInsight?.profileTitle ?? "Waiting for their first result"}</h3></div><span className="heart-seal">♡</span></div>
            {partnerInsight ? (
              <>
                <p>{partnerInsight.summary}</p>
                <div className="partner-tip"><span>For you to try</span>{partnerInsight.care[0]}</div>
                <button className="text-button">See their care map <span>→</span></button>
              </>
            ) : (
              <>
                <p>Once your partner joins and completes a quiz, their practical care suggestions will appear here.</p>
                <div className="partner-tip muted"><span>Coming soon</span>A gentle, useful insight made just for the two of you.</div>
              </>
            )}
          </article>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">R</span><span>Relatune</span></a>
        <p>Made for curiosity, care, and kinder conversations.</p>
        <p className="disclaimer">Original educational reflections; not affiliated with official assessment publishers and not a diagnosis.</p>
      </footer>

      {activeQuiz && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${activeQuiz.title} quiz`}>
          <div className="quiz-modal">
            <button className="modal-close" onClick={() => setActiveQuiz(null)} aria-label="Close quiz">×</button>
            {!result ? (
              <>
                <div className="quiz-progress"><span style={{ width: `${((step + 1) / activeQuiz.questions.length) * 100}%` }} /></div>
                <p className="modal-kicker">{activeQuiz.kicker} · Question {step + 1} of {activeQuiz.questions.length}</p>
                <h2>{activeQuiz.questions[step].prompt}</h2>
                <div className="answer-list">
                  {activeQuiz.questions[step].options.map((option) => (
                    <button key={option.label} onClick={() => chooseAnswer(option.value)}>
                      <span>{option.label}</span><i>→</i>
                    </button>
                  ))}
                </div>
                <p className="modal-note">Choose what feels most true most often. Your answer is never judged.</p>
              </>
            ) : (
              <div className="result-view">
                <div className="result-symbol">♡</div>
                <p className="modal-kicker">Your result</p>
                <h2>{result.profile.title}</h2>
                <p className="result-summary">{result.profile.summary}</p>
                <div className="result-care">
                  <h3>How to care for me</h3>
                  {result.profile.care.map((tip) => <div key={tip}><span>✓</span>{tip}</div>)}
                </div>
                <div className="watch-for"><b>A gentle watch-out</b>{result.profile.watchFor}</div>
                {!user && <p className="save-prompt">Sign in to save this result and share it with your partner.</p>}
                <div className="result-actions">
                  {!user && <a className="primary-button" href="/login">Sign in to save</a>}
                  <button className="outline-button" onClick={() => setActiveQuiz(null)}>Back to dashboard</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {pairMode && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Connect profiles">
          <div className="pair-modal">
            <button className="modal-close" onClick={() => setPairMode(null)} aria-label="Close">×</button>
            <div className="pair-symbol">♡＋♡</div>
            <p className="modal-kicker">A private personality library for two</p>
            <h2>{pairMode === "create" ? "Create your shared space" : "Join your partner"}</h2>
            <p>{pairMode === "create" ? "We’ll make a one-time code you can send to your partner." : "Enter the code exactly as your partner shared it."}</p>
            {pairMode === "join" && (
              <input className="code-input" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="SIX-CHARACTER CODE" maxLength={8} aria-label="Partner code" />
            )}
            <button className="primary-button dark full" disabled={loadingPair} onClick={pairMode === "create" ? createPair : joinPair}>
              {loadingPair ? "Connecting…" : pairMode === "create" ? "Create code" : "Connect profiles"}
            </button>
            {pairMessage && <p className="pair-message">{pairMessage}</p>}
            {!user && <p className="save-prompt">This is a preview. <a href="/login">Sign in</a> to create a real saved space.</p>}
          </div>
        </div>
      )}
    </main>
  );
}

