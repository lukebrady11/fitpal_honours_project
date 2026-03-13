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

      if (data.triage) {
        logEvent(apiBase, {
          type: "safety_triage_triggered",
          isLoggedIn,
          meta: { triage: data.triage },
        });
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (data.planDraft && data.planDraft.items) {
        setLatestPlanDraft(data.planDraft);
        logEvent(apiBase, { type: "plan_generated", isLoggedIn });
      }

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
          <h2 className="text-xl font-semibold tracking-tight text-white">Chat</h2>
          <p className="text-sm text-slate-400">
            Ask for workouts, meal plans, or habit tips. Plans can be saved to your
            Planner and Diet tabs.
          </p>
        </div>

        <div className="hidden md:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-white/5 px-3 py-1 text-xs text-lime-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            Fitness • Diet • Planner
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
        <div className="flex h-[560px] flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={[
                    "max-w-[82%] rounded-2xl px-4 py-3 shadow-sm border whitespace-pre-wrap leading-relaxed text-sm",
                    msg.role === "user"
                      ? "self-end border-lime-400/20 bg-lime-500/15 text-white"
                      : "self-start border-white/10 bg-slate-900/60 text-slate-100",
                  ].join(" ")}
                >
                  {msg.content}
                </div>
              ))}

              {latestPlanDraft ? (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-500/10 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Workout plan ready</div>
                      <div className="text-xs text-slate-400">
                        {latestPlanDraft.title || "Workout plan"}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs border border-lime-400/20 text-lime-300">
                      Plan
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-200">
                    {latestPlanDraft.items.slice(0, 6).map((it, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-medium text-white">
                          {it.day} {it.time}
                        </span>
                        <span className="text-slate-300">— {it.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={addPlan}
                      className="px-4 py-2.5 rounded-xl bg-lime-500 text-slate-950 shadow-sm hover:bg-lime-400 active:scale-[0.99] transition text-sm font-medium"
                    >
                      Add to planner
                    </button>
                    <button
                      onClick={() => setLatestPlanDraft(null)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              {latestDietDraft ? (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-500/10 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Diet plan ready</div>
                      <div className="text-xs text-slate-400">
                        {latestDietDraft.title || "Meal plan"}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs border border-lime-400/20 text-lime-300">
                      Diet
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-200">
                    {latestDietDraft.items.slice(0, 6).map((it, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-medium text-white">{it.meal}</span>
                        <span className="text-slate-300">— {it.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={addDiet}
                      className="px-4 py-2.5 rounded-xl bg-lime-500 text-slate-950 shadow-sm hover:bg-lime-400 active:scale-[0.99] transition text-sm font-medium"
                    >
                      Add to diet planner
                    </button>
                    <button
                      onClick={() => setLatestDietDraft(null)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-300/20"
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
                    ? "bg-lime-300 text-slate-900 cursor-not-allowed"
                    : "bg-lime-500 text-slate-950 hover:bg-lime-400 active:scale-[0.99]",
                ].join(" ")}
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="mt-2 text-xs text-slate-400">
                Guest saves used: {guestSavesUsed || 0}/{guestSavesLimit || 5} — register to
                save unlimited.
              </div>
            ) : null}

            <div className="mt-2 text-[11px] text-slate-500">
              FitPal provides general lifestyle guidance only — not medical advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}