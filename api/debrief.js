// The end-of-call debrief, written by the coach from the transcript and scores.

import { COACH_PROMPT, COACH_DEBRIEF_RULES, COACH_POLICY_RULES, COACH_PRONOUNS, COACH_PROFILE_RULES, COACH_REAL_ISSUE, SKILLS } from "../prompts/coach.js";
import { profileAsText } from "../public/profile.js";
import { policyAsText, POLICY_LIBRARY } from "../public/policy.js";
import { askClaude, readTranscript, asScript, handler, DEMO_MODE } from "../lib/claude.js";
import { demoDebrief } from "../lib/demo.js";

// The exact shape the debrief must come back in, so the screen can lay it out.
const DEBRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "strengths",
    "growthAreas",
    "uncoveredRealIssue",
    "realIssueNote",
    "planAgreed",
    "followUpAgreed",
    "planNote",
    "policyResult",
    "policyNote",
    "overall",
    "skillReasons",
  ],
  properties: {
    strengths: { type: "array", items: { type: "string" }, description: "Exactly two strengths." },
    growthAreas: { type: "array", items: { type: "string" }, description: "Exactly two growth areas." },
    uncoveredRealIssue: { type: "boolean", description: "Apply the marking rule for the real issue." },
    realIssueNote: { type: "string", description: "One sentence on how the real issue came out (quote the manager's words that opened it up, with a timing word like 'about halfway through'), or what blocked it. No turn numbers." },
    planAgreed: { type: "boolean", description: "A concrete plan was agreed." },
    followUpAgreed: { type: "boolean", description: "A specific follow-up (time or check-in) was agreed." },
    planNote: { type: "string", description: "One sentence describing the plan, or what was missing." },
    policyResult: {
      type: "string",
      enum: ["yes", "mostly", "no"],
      description:
        "yes = the approach and plan fit the HR policies. mostly = the approach was sound and nothing went against policy, but a step was missed (for example, the written summary or the EAP). no = something went against policy (for example, promising leave, asking about medical details, or approving something only HR or a department head can approve), or no plan at all.",
    },
    policyNote: { type: "string", description: "One or two short sentences: what fit the policy, and the single most important thing missed (if any). No lists of every rule." },
    overall: {
      type: "string",
      description:
        "The headline: one short, punchy sentence of 15 words or fewer with the single biggest takeaway. Not a list of advice; the details belong in the other fields.",
    },
    skillReasons: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(SKILLS),
      properties: Object.fromEntries(
        Object.keys(SKILLS).map((k) => [
          k,
          {
            type: "string",
            description:
              "One plain sentence explaining this skill's scores, addressed to the manager as 'you'. Name what helped and what held the score back, briefly quoting a moment if useful. Empty string if the skill wasn't scored.",
          },
        ])
      ),
    },
  },
};

export default handler(async (body) => {
  const transcript = readTranscript(body);
  const turnScores = Array.isArray(body.turnScores) ? body.turnScores.slice(0, 60) : [];

  if (DEMO_MODE) return demoDebrief(transcript);

  // Which HR policies the learner opened (counted by the app). Only known policy numbers are kept.
  const known = new Set(POLICY_LIBRARY.policies.map((p) => p.number));
  const use = body.policyUse && typeof body.policyUse === "object" ? body.policyUse : {};
  const clean = (list) => (Array.isArray(list) ? list.filter((n) => known.has(n)) : []);
  const before = clean(use.before);
  const during = clean(use.during);
  const policyUseLine =
    before.length || during.length
      ? `Opened before the call: ${before.join(", ") || "none"}. Opened during the call: ${during.join(", ") || "none"}.`
      : "The manager did not open any HR policies, before or during the call.";
  const toolkitLine = use.toolkitBefore ? "The manager reviewed the manager toolkit before the call." : "The manager did not open the manager toolkit before the call.";

  // Label each set of scores with what the manager said, instead of a number.
  const managerLines = transcript.filter((t) => t.role === "manager").map((t) => t.text);
  const scoreLines = turnScores
    .map((s, i) => {
      const said = (managerLines[i] || "").slice(0, 80);
      return `When the manager said "${said}${said.length === 80 ? "…" : ""}": ${JSON.stringify(s && typeof s === "object" ? s : {})}`;
    })
    .join("\n");

  return askClaude({
    system: `${COACH_PROMPT}\n\n${COACH_POLICY_RULES}\n\n<policy>\n${policyAsText()}\n</policy>\n\n${COACH_REAL_ISSUE}\n\n${COACH_PRONOUNS} ${COACH_PROFILE_RULES}\n\n<profile>\n${profileAsText()}\n</profile>`,
    messages: [
      {
        role: "user",
        content: `${COACH_DEBRIEF_RULES}\n\nSkill keys: ${JSON.stringify(SKILLS)}\n\nTranscript:\n\n${asScript(
          transcript
        )}\n\nPolicy library use (counted by the app): ${policyUseLine} ${toolkitLine}\n\nScores, in order:\n${scoreLines || "(none)"}`,
      },
    ],
    effort: "medium",
    maxTokens: 8000,
    schema: DEBRIEF_SCHEMA,
  });
});
