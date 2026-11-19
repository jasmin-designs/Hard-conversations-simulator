// ============================================================
//  THE POLICY JOB AID
//  A fictional company's guidance for managers. Learners can open it on the
//  start screen and during the call, and the coach uses it to check whether
//  the manager's approach and plan fit the policy. Jordan never sees it.
//
//  To adapt it for another company, edit the text below. Keep each point
//  short: it's a job aid, not the full policy manual.
// ============================================================

export const POLICY = {
  company: "Northwind Logistics",
  title: "Attendance & Flexibility: Manager Quick Guide",
  intro:
    "Use this guide when an employee's attendance or deadlines slip. Lead with curiosity: the policy supports the conversation, it doesn't replace it.",
  sections: [
    {
      heading: "The expectation",
      points: [
        "Standard hours are 9:00–5:30, unless a different schedule has been agreed.",
        "Arriving more than 10 minutes after the scheduled start without notice counts as late.",
        "If running late, employees should message their manager before their start time.",
      ],
    },
    {
      heading: "In the conversation",
      points: [
        "Talk privately and early. Don't wait for a pattern to become a problem.",
        "Name specific dates and the impact on the team or the work.",
        "Ask what's going on. Don't ask about medical details or diagnose.",
      ],
    },
    {
      heading: "Options you can approve yourself",
      points: [
        "A shifted start and end time, as long as the employee works core hours, 10:00–3:00.",
        "Up to 2 remote days per week, where the role allows.",
        "Short-term adjustments to deadlines or workload, for up to 4 weeks.",
      ],
    },
    {
      heading: "Bring in HR (don't decide alone)",
      points: [
        "Ongoing caregiving, family, or health needs may qualify for protected leave or a formal accommodation. Say: \"HR can walk you through your options.\"",
        "Don't promise leave, approve unpaid time off, or share the employee's situation with the team.",
        "HR Partner line: ext. 4400 · hr@northwind.example",
      ],
    },
    {
      heading: "Support resources",
      points: [
        "Employee Assistance Program (EAP): free, confidential, 24/7 support, including caregiver resources. Offer it; don't require it.",
      ],
    },
    {
      heading: "Document and follow up",
      points: [
        "Within 1 business day, send the employee a short written summary of what you agreed.",
        "Set a check-in within 2 weeks to review how the plan is working.",
        "Formal steps, such as a written warning, only after talking with HR and only if issues continue after an agreed plan.",
      ],
    },
  ],
};

/** The policy as plain text, for the coach's instructions. */
export function policyAsText(policy = POLICY) {
  return [
    `${policy.company}: ${policy.title}`,
    policy.intro,
    ...policy.sections.map((s) => `${s.heading}:\n${s.points.map((p) => `- ${p}`).join("\n")}`),
  ].join("\n\n");
}
