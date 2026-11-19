// The end-of-call debrief, written by the coach from the transcript and scores.

import { COACH_PROMPT, COACH_DEBRIEF_RULES, COACH_POLICY_RULES, SKILLS } from "../prompts/coach.js";
import { policyAsText } from "../public/policy.js";
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
    "uncoveredOnTurn",
    "realIssueNote",
    "planAgreed",
    "followUpAgreed",
    "planNote",
    "policyAligned",
    "policyNote",
    "overall",
  ],
  properties: {
    strengths: { type: "array", items: { type: "string" }, description: "Exactly two strengths." },
    growthAreas: { type: "array", items: { type: "string" }, description: "Exactly two growth areas." },
    uncoveredRealIssue: { type: "boolean" },
    uncoveredOnTurn: { type: "integer", description: "Manager turn number when the real issue surfaced; 0 if never." },
    realIssueNote: { type: "string", description: "One sentence on how the real issue came out, or what blocked it." },
    planAgreed: { type: "boolean", description: "A concrete plan was agreed." },
    followUpAgreed: { type: "boolean", description: "A specific follow-up (time or check-in) was agreed." },
    planNote: { type: "string", description: "One sentence describing the plan, or what was missing." },
    policyAligned: { type: "boolean", description: "The manager's approach and plan fit the company policy job aid." },
    policyNote: { type: "string", description: "One sentence on how the approach fit the policy, or what it missed (e.g. involving HR, written summary, check-in)." },
    overall: { type: "string", description: "A one-sentence overall takeaway." },
  },
};

export default handler(async (body) => {
  const transcript = readTranscript(body);
  const turnScores = Array.isArray(body.turnScores) ? body.turnScores.slice(0, 60) : [];

  if (DEMO_MODE) return demoDebrief(transcript);

  const scoreLines = turnScores
    .map((s, i) => `Turn ${i + 1}: ${JSON.stringify(s && typeof s === "object" ? s : {})}`)
    .join("\n");

  return askClaude({
    system: `${COACH_PROMPT}\n\n${COACH_POLICY_RULES}\n\n<policy>\n${policyAsText()}\n</policy>`,
    messages: [
      {
        role: "user",
        content: `${COACH_DEBRIEF_RULES}\n\nSkill keys: ${JSON.stringify(SKILLS)}\n\nTranscript:\n\n${asScript(
          transcript
        )}\n\nPer-turn scores:\n${scoreLines || "(none)"}`,
      },
    ],
    effort: "medium",
    maxTokens: 8000,
    schema: DEBRIEF_SCHEMA,
  });
});
