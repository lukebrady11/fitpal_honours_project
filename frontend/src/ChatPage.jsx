import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logEvent } from "./analytics";

export default function ChatPage({ plannerApi, dietApi }) {
  const addPlanDraftToPlanner = plannerApi?.addPlanDraftToPlanner || (() => {});
  const { guestSavesUsed, guestSavesLimit, isLoggedIn } = plannerApi || {};
  const addDietDraftToPlanner = dietApi?.addDietDraftToPlanner || (() => {});

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m FitPal 👋 Ask me for a simple workout plan, meal ideas, or motivation.\nTry: “Make me a 3-day beginner workout plan for this week at 6pm” or “Give me a simple 3-day meal plan”.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [latestPlanDraft, setLatestPlanDraft] = useState(null);
  const [latestDietDraft, setLatestDietDraft] = useState(null);

  const bottomRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestPlanDraft, latestDietDraft]);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    setInput("");
    setIsSending(true);

    setLatestPlanDraft(null);
    setLatestDietDraft(null);

    const nextMessages = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);

    // ✅ Evaluation: user sent a chat message
    logEvent(apiBase, { type: "chat_message_sent", isLoggedIn });

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userText,
          history: nextMessages.slice(-12),
        }),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Server returned non-JSON: ${raw.slice(0, 160)}`);
      }

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} ${res.statusText} — ${data.error || raw || "No body"}`
        );
      }

      // ✅ Evaluation: safety triage
      if (data.triage) {
        logEvent(apiBase, {
          type: "safety_triage_triggered",
          isLoggedIn,
          meta: { triage: data.triage },
        });
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // Workout plan draft
      if (data.planDraft && data.planDraft.items) {
        setLatestPlanDraft(data.planDraft);
        logEvent(apiBase, { type: "plan_generated", isLoggedIn });
      }

      // Diet plan draft
      if (data.dietDraft && data.dietDraft.items) {
        setLatestDietDraft(data.dietDraft);
        logEvent(apiBase, { type: "diet_plan_generated", isLoggedIn });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${String(err.message || err)}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const addPlan = () => {
    if (!latestPlanDraft) return;

    const result = addPlanDraftToPlanner(latestPlanDraft);

    if (!result?.ok && result?.reason === "guest_limit_reached") {
      setLatestPlanDraft(null);

      logEvent(apiBase, { type: "guest_limit_hit", isLoggedIn: false });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ You’ve reached the 5 guest saves limit. Register (free) or log in to keep saving workout plans.",
        },
      ]);
      nav("/register");
      return;
    }

    setLatestPlanDraft(null);

    logEvent(apiBase, { type: "plan_saved", isLoggedIn });

    if (!isLoggedIn && typeof result?.remaining === "number") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Added to your planner. Guest saves remaining: ${result.remaining}/5.`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✅ Added to your planner. Check the Planner tab." },
      ]);
    }
  };

  const addDiet = () => {
    if (!latestDietDraft) return;

    const result = addDietDraftToPlanner(latestDietDraft);

    if (result?.ok === false) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Couldn’t add diet plan. Try again." },
      ]);
      return;
    }

    setLatestDietDraft(null);

    logEvent(apiBase, { type: "diet_plan_saved", isLoggedIn });

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "✅ Added to your diet planner. Check the Diet tab." },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Chat</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Ask for workouts, meal plans, or habit tips. Plans can be saved to your
            Planner/Diet tabs.
          </p>
        </div>

        <div className="hidden md:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-[rgb(var(--surface-2))] px-3 py-1 text-xs text-purple-700">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Modern • Light Purple
          </span>
        </div>
      </div>

      {/* Chat container */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white shadow-sm">
        <div className="flex h-[560px] flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={[
                    "max-w-[82%] rounded-2xl px-4 py-3 shadow-sm border whitespace-pre-wrap leading-relaxed text-sm",
                    msg.role === "user"
                      ? "self-end border-purple-100 bg-purple-50 text-slate-900"
                      : "self-start border-[rgb(var(--border))] bg-white text-slate-900",
                  ].join(" ")}
                >
                  {msg.content}
                </div>
              ))}

              {/* Workout plan card */}
              {latestPlanDraft ? (
                <div className="rounded-2xl border border-purple-200 bg-[rgb(var(--surface-2))] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Workout plan ready
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {latestPlanDraft.title || "Workout plan"}
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs border border-purple-200 text-purple-700">
                      Plan
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-800">
                    {latestPlanDraft.items.slice(0, 6).map((it, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-medium text-slate-900">
                          {it.day} {it.time}
                        </span>
                        <span className="text-slate-700">— {it.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={addPlan}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:scale-[0.99] transition text-sm font-medium"
                    >
                      Add to planner
                    </button>
                    <button
                      onClick={() => setLatestPlanDraft(null)}
                      className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-white hover:bg-slate-50 transition text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Diet plan card */}
              {latestDietDraft ? (
                <div className="rounded-2xl border border-purple-200 bg-[rgb(var(--surface-2))] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Diet plan ready
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {latestDietDraft.title || "Meal plan"}
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs border border-purple-200 text-purple-700">
                      Diet
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-800">
                    {latestDietDraft.items.slice(0, 6).map((it, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-medium text-slate-900">{it.meal}</span>
                        <span className="text-slate-700">— {it.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={addDiet}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:scale-[0.99] transition text-sm font-medium"
                    >
                      Add to diet planner
                    </button>
                    <button
                      onClick={() => setLatestDietDraft(null)}
                      className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-white hover:bg-slate-50 transition text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input row */}
          <div className="border-t border-[rgb(var(--border))] p-4">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-white text-sm focus:outline-none focus:ring-4 focus:ring-purple-200"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isSending ? "Sending..." : "Type your message..."}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isSending}
              />
              <button
                onClick={sendMessage}
                disabled={isSending}
                className={[
                  "px-4 py-3 rounded-xl text-sm font-medium shadow-sm transition",
                  isSending
                    ? "bg-purple-300 text-white cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]",
                ].join(" ")}
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                Guest saves used: {guestSavesUsed || 0}/{guestSavesLimit || 5} — register to
                save unlimited.
              </div>
            ) : null}

            <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">
              FitPal provides general lifestyle guidance only — not medical advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
