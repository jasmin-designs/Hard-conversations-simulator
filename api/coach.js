// AI #2: the coach. Reviews the manager's most recent turn.
// Returns { verdict, why, tryInstead, scores } where scores is the hidden JSON.

import { COACH_PROMPT, COACH_TURN_RULES, COACH_POLICY_RULES, SKILLS } from "../prompts/coach.js";
import { policyAsText } from "../public/policy.js";
import { askClaude, readTranscript, asScript, handler, DEMO_MODE } from "../lib/claude.js";
import { demoCoach } from "../lib/demo.js";

export default handler(async (body) => {
  const transcript = readTranscript(body);
  const text = DEMO_MODE
    ? demoCoach(transcript)
    : await askClaude({
        system: `${COACH_PROMPT}\n\n${COACH_POLICY_RULES}\n\n<policy>\n${policyAsText()}\n</policy>\n\n${COACH_TURN_RULES}`,
        messages: [
          {
            role: "user",
            content: `Conversation so far:\n\n${asScript(transcript)}\n\nGive feedback on the manager's most recent turn.`,
          },
        ],
        effort: "low",
        maxTokens: 2000,
      });
  return parseCoach(text);
});

/** Splits the coach's reply into its parts. Exported for testing. */
export function parseCoach(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // The hidden scores: the last line that looks like JSON.
  let scores = {};
  const jsonIndex = lines.findLastIndex((l) => l.startsWith("{") && l.endsWith("}"));
  if (jsonIndex !== -1) {
    try {
      const raw = JSON.parse(lines[jsonIndex]);
      for (const [k, v] of Object.entries(raw)) {
        const n = Number(v);
        if (k in SKILLS && n >= 1 && n <= 5) scores[k] = Math.round(n);
      }
    } catch {
      /* ignore unreadable scores */
    }
    lines.splice(jsonIndex, 1);
  }

  const field = (label) => {
    const line = lines.find((l) => l.replace(/^[*\-•\s]+/, "").toLowerCase().startsWith(label));
    return line ? line.replace(/^[*\-•\s]+/, "").slice(label.length).replace(/^[*:\s]+/, "").trim() : "";
  };

  let verdict = field("verdict").replace(/[*.]/g, "").trim();
  if (/warm/i.test(verdict)) return { verdict: "Warm-up", why: "", tryInstead: "", scores: {} };
  if (/strong/i.test(verdict)) verdict = "Strong";
  else if (/needs/i.test(verdict)) verdict = "Needs work";
  else if (/okay|ok/i.test(verdict)) verdict = "Okay";
  else verdict = "Okay";

  const why = field("why") || lines.join(" ");
  const tryInstead = verdict === "Strong" ? "" : field("try instead").replace(/^["“]|["”]$/g, "");

  return { verdict, why, tryInstead, scores };
}
