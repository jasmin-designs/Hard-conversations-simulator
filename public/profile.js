// ============================================================
//  "KNOW YOUR EMPLOYEE" PROFILE
//  What the manager already knows about Jordan from working together.
//  Shown in Step 1, Prepare. The coach also reads it, to note (not score)
//  whether the manager adapted to Jordan's style.
//  Must never hint at the hidden backstory (nothing about home, family,
//  health, or mornings).
// ============================================================

export const PROFILE = {
  company: "Northwind Logistics",
  label: "Know your employee",
  title: "Jordan",
  intro: "What you know about Jordan from working together. Use it to plan your approach.",
  sections: [
    {
      heading: "Role",
      points: ["Project Coordinator, 3 years on the team. She manages project timelines and prepares materials for client meetings."],
    },
    {
      heading: "Track record",
      points: ["Strong performance reviews every year. Reliable with deadlines, and teammates often go to her for help."],
    },
    {
      heading: "Communication style",
      points: ["Quiet in group meetings, more open one-on-one. Responds well to direct, respectful feedback; tends to go quiet if criticized in front of others."],
    },
    {
      heading: "What she values",
      points: ["Being trusted with responsibility, and doing careful, reliable work."],
    },
    {
      heading: "Your working relationship",
      points: ["Good. You meet for monthly 1:1s, and the conversation sometimes drifts to personal topics, like weekend plans, but stays surface level."],
    },
  ],
  footnote: "Fictional employee, written for practice purposes.",
};

/** The profile as plain text, for the AI instructions. */
export function profileAsText(p = PROFILE) {
  return p.sections.map((s) => `${s.heading}: ${s.points.join(" ")}`).join("\n");
}
