// ============================================================
//  THE HR POLICY
//  A fictional company's attendance policy: rules and procedures only.
//  Learners can open it on the start screen and during the call, and the
//  coach uses it to check whether the manager's approach and plan fit.
//  Jordan never sees it.
//
//  (The "how to have the conversation" guidance is in toolkit.js.)
// ============================================================

export const POLICY = {
  company: "Northwind Logistics",
  label: "HR Policy",
  title: "Attendance and Punctuality (HR-104)",
  intro:
    "Purpose: to set clear attendance expectations, describe the flexible work options available, and explain when Human Resources must be involved. Applies to all full-time and part-time employees. Effective January 1, 2026.",
  sections: [
    {
      heading: "1. Standard hours and punctuality",
      points: [
        "Standard working hours are 9:00 a.m. to 5:30 p.m., unless an alternative schedule has been approved in writing.",
        "An employee is late when they arrive more than 10 minutes after their scheduled start time without prior notice.",
        "Employees who expect to be late must notify their manager before their scheduled start time.",
      ],
    },
    {
      heading: "2. Flexible work arrangements",
      points: [
        "Managers may approve an adjusted start and end time, provided the employee works the core hours of 10:00 a.m. to 3:00 p.m.",
        "Managers may approve up to two remote workdays per week where the role allows.",
        "Managers may approve temporary adjustments to deadlines or workload for up to four weeks. Longer arrangements require HR review.",
      ],
    },
    {
      heading: "3. Leave and accommodations",
      highlight: true,
      points: [
        "Ongoing caregiving, family, or health needs may qualify for protected leave or a formal accommodation. Managers must refer these requests to HR.",
        "Managers may not approve unpaid leave or promise leave eligibility.",
        "Managers must not ask about medical details or diagnoses.",
        "HR Partner line: ext. 4400 · hr@northwind.example",
      ],
    },
    {
      heading: "4. Confidentiality",
      points: [
        "Personal, family, and health information shared by an employee must be kept confidential and shared only with HR as needed.",
      ],
    },
    {
      heading: "5. Employee Assistance Program (EAP)",
      points: [
        "All employees have access to free, confidential support 24/7, including caregiver resources. Participation is voluntary.",
      ],
    },
    {
      heading: "6. Documentation and follow-up",
      points: [
        "Managers must provide the employee with a written summary of any agreed plan within one business day.",
        "A follow-up meeting must take place within two weeks of the agreement.",
        "Formal corrective action, such as a written warning, requires prior consultation with HR and may be used only if attendance issues continue after an agreed plan.",
      ],
    },
  ],
  footnote: "Fictional company policy, written for practice purposes.",
};

/** The policy as plain text, for the coach's instructions. */
export function policyAsText(policy = POLICY) {
  return [
    `${policy.company} ${policy.label}: ${policy.title}`,
    policy.intro,
    ...policy.sections.map((s) => `${s.heading}:\n${s.points.map((p) => `- ${p}`).join("\n")}`),
  ].join("\n\n");
}
