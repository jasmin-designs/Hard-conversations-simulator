// ============================================================
//  THE HR POLICY LIBRARY
//  A fictional company's HR policies: rules and procedures only.
//  Learners can open the library on the start screen and during the call,
//  and the coach uses it to check whether the manager's approach and plan fit.
//  Jordan never sees it.
//
//  Each policy is separate, like a real company's library, so learners have
//  to decide which ones apply. They open as plain policy documents, and
//  nothing is highlighted on purpose: the library shouldn't hint at
//  Jordan's hidden backstory. Section and clause numbers (1, 1.1, ...) are
//  added automatically on screen.
//
//  (The "how to have the conversation" guidance is in toolkit.js.)
// ============================================================

export const POLICY_LIBRARY = {
  company: "Northwind Logistics",
  label: "HR Policy Library",
  footnote: "Fictional company policies, written for practice purposes.",
  policies: [
    {
      number: "HR-104",
      owner: "Human Resources",
      appliesTo: "All employees",
      effective: "January 1, 2024",
      revised: "March 3, 2025",
      title: "Attendance and Punctuality",
      purpose:
        "Sets expectations for working hours, punctuality, and notice, and describes how attendance concerns are addressed.",
      sections: [
        {
          heading: "Standard hours",
          points: [
            "Standard working hours are 9:00 a.m. to 5:30 p.m., unless an alternative schedule has been approved in writing under HR-210.",
          ],
        },
        {
          heading: "Punctuality and notice",
          points: [
            "An employee is late when they arrive more than 10 minutes after their scheduled start time without prior notice.",
            "Employees who expect to be late must notify their manager before their scheduled start time.",
          ],
        },
        {
          heading: "Addressing attendance concerns",
          points: [
            "Managers should raise attendance concerns with the employee promptly.",
            "Any agreed plan must be summarized in writing and shared with the employee within one business day.",
            "A follow-up meeting must take place within two weeks of the agreement.",
          ],
        },
        {
          heading: "Corrective action",
          points: [
            "Formal corrective action, such as a written warning, requires prior consultation with HR.",
            "Corrective action may be used only if attendance concerns continue after an agreed plan.",
          ],
        },
      ],
    },
    {
      number: "HR-210",
      owner: "Human Resources",
      appliesTo: "Employees whose roles allow flexible work",
      effective: "January 1, 2024",
      revised: "August 18, 2025",
      title: "Flexible Work Arrangements",
      purpose:
        "Describes the flexible work options available and who may approve them.",
      sections: [
        {
          heading: "Adjusted hours",
          points: [
            "Managers may approve an adjusted start and end time, provided the employee works the core hours of 10:00 a.m. to 3:00 p.m.",
          ],
        },
        {
          heading: "Remote work",
          points: ["Managers may approve up to two remote workdays per week where the role allows."],
        },
        {
          heading: "Temporary adjustments",
          points: [
            "Managers may approve temporary adjustments to deadlines or workload for up to four weeks.",
            "Adjustments longer than four weeks require HR review.",
          ],
        },
        {
          heading: "Documentation and review",
          points: [
            "All arrangements must be documented in writing.",
            "Arrangements are reviewed at least every three months, or sooner if business needs change.",
          ],
        },
      ],
    },
    {
      number: "HR-305",
      owner: "Human Resources",
      appliesTo: "All employees",
      effective: "January 1, 2024",
      revised: "June 9, 2025",
      title: "Leave of Absence and Accommodations",
      purpose:
        "Explains the types of leave available, how eligibility is determined, and the process for requesting accommodations.",
      sections: [
        {
          heading: "Types of leave",
          points: [
            "Paid time off (vacation and personal days)",
            "Sick leave",
            "Family and caregiver leave",
            "Medical leave",
            "Bereavement leave",
          ],
        },
        {
          heading: "Eligibility",
          points: [
            "Eligibility for protected leave and accommodations is determined by HR, not by managers.",
            "Managers may not approve unpaid leave or promise leave eligibility.",
          ],
        },
        {
          heading: "Referral to HR",
          points: [
            "A manager who learns that an employee may need leave or an accommodation must refer the employee to HR within two business days.",
            "HR Partner line: ext. 4400 · hr@northwind.example",
          ],
        },
        {
          heading: "Privacy",
          points: [
            "Managers must not ask about medical details or diagnoses.",
            "Personal, family, and health information shared by an employee is confidential and may be shared only with HR.",
          ],
        },
      ],
    },
    {
      number: "HR-410",
      owner: "Human Resources",
      appliesTo: "All employees and their household members",
      effective: "January 1, 2024",
      revised: "November 4, 2024",
      title: "Employee Assistance Program",
      purpose:
        "Describes the free, confidential support available to employees and their household members.",
      sections: [
        {
          heading: "Services",
          points: [
            "Short-term counseling",
            "Financial and legal consultations",
            "Childcare, eldercare, and caregiving resources",
            "Stress management and wellbeing support",
            "Available 24/7 by phone or online.",
          ],
        },
        {
          heading: "Access",
          points: [
            "Managers may share EAP information with any employee.",
            "Participation is voluntary and confidential. Managers are not told who uses the EAP.",
          ],
        },
      ],
    },
  ],
};

/** All policies as plain text, for the coach's instructions. */
export function policyAsText(library = POLICY_LIBRARY) {
  return library.policies
    .map((p) =>
      [
        `${library.company} ${p.number}: ${p.title} (applies to: ${p.appliesTo}; effective ${p.effective})`,
        `Purpose: ${p.purpose}`,
        ...p.sections.map((s, i) => `${i + 1}. ${s.heading}\n${s.points.map((x, j) => `${i + 1}.${j + 1} ${x}`).join("\n")}`),
      ].join("\n")
    )
    .join("\n\n");
}
