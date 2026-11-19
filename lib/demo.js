// Canned responses used only when DEMO_MODE=1. They let you click through the
// whole app without an API key (and without spending anything).

const JORDAN_LINES = [
  "Hi. Um, yeah, you wanted to talk?",
  "Okay... I mean, I know I've been a little late. I've still been getting my work done though.",
  "Yeah. That's fair. It's just... things have been kind of hard at home lately.",
  "My mom moved in with me a couple months ago. I'm kind of her main caregiver now, and mornings are... unpredictable. I didn't really want to make it a thing.",
  "That would actually help a lot. Could I maybe start at 9:30 and stay later? And yeah, a check-in next Friday works.",
];

export function demoEmployee(transcript) {
  const managerTurns = transcript.filter((t) => t.role === "manager").length;
  return JORDAN_LINES[Math.min(managerTurns - 1, JORDAN_LINES.length - 1)];
}

const COACH_NOTES = [
  `Verdict: Okay\nWhy: A friendly opener, but Jordan likely feels uneasy not knowing why you called.\nTry instead: "Thanks for making time. I want to talk about a couple of late mornings and how you're doing."\n{"tone": 4, "specifics": 2}`,
  `Verdict: Strong\nWhy: You named the specific behavior and its impact calmly. Jordan likely feels a bit defensive but respected.\n{"specifics": 5, "tone": 4}`,
  `Verdict: Strong\nWhy: An open question with real curiosity. Jordan likely feels safe enough to start opening up.\n{"questions": 5, "emotions": 4}`,
  `Verdict: Okay\nWhy: Good empathy, but moving to solutions quickly may leave Jordan feeling rushed.\nTry instead: "That sounds like a lot. What would make mornings more workable for you?"\n{"emotions": 4, "plan": 3}`,
];

export function demoCoach(transcript) {
  const managerLines = transcript.filter((t) => t.role === "manager").map((t) => t.text);
  const latest = managerLines.at(-1) || "";
  const smallTalk = /^(hi|hey|hello|good (morning|afternoon)|how are you|how's it going)\b[^.?!]{0,25}[.?!]*$/i;
  if (managerLines.length === 1 && smallTalk.test(latest.trim())) return "Verdict: Warm-up\n{}";
  if (managerLines.length === 2 && smallTalk.test(managerLines[0].trim())) {
    return `Verdict: Okay\nWhy: Taken together, your greeting and this message open the conversation, but Jordan still isn't sure why you called.\nTry instead: "Thanks for making time. I want to talk about a couple of late mornings and how you're doing."\n{"tone": 4, "specifics": 2}`;
  }
  return COACH_NOTES[(managerLines.length - 1) % COACH_NOTES.length];
}

export function demoDebrief(transcript) {
  const managerTurns = transcript.filter((t) => t.role === "manager").length;
  return {
    strengths: [
      "You named the late arrivals and missed deadlines specifically, without labeling Jordan.",
      "Your open question gave Jordan room to explain what was really going on.",
    ],
    growthAreas: [
      "Your opener didn't say why you'd called, which put Jordan on guard.",
      "Pause on the emotion before moving to solutions, so Jordan feels heard.",
    ],
    uncoveredRealIssue: managerTurns >= 3,
    realIssueNote:
      managerTurns >= 3
        ? "About halfway through, when you asked \"What is going on?\", Jordan opened up about their caregiving situation."
        : "The conversation ended before Jordan felt safe enough to share.",
    planAgreed: managerTurns >= 4,
    followUpAgreed: managerTurns >= 4,
    planNote:
      managerTurns >= 4
        ? "A later start time with a check-in next Friday."
        : "No plan was agreed yet.",
    policyAligned: managerTurns >= 4,
    policyNote:
      managerTurns >= 4
        ? "The shifted start time is an option you can approve yourself. Next, mention HR for longer-term caregiving support."
        : "No plan yet, so there was nothing to check against the policy.",
    overall: "(Demo mode) A solid start: specific, calm, and curious.",
  };
}
