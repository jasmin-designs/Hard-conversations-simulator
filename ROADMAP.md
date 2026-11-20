# Roadmap: Hard Conversations Practice Library

**The vision:** a practice library where managers choose which hard conversation to rehearse, with an AI employee who reacts realistically and a coach who gives feedback on every turn. All the supporting resources (the HR policy library and manager toolkits) live on the home screen.

*Designed by Jasmin. Started November 2026.*

---

## Where we are today

One complete scenario, live at **hard-conversations-simulator.vercel.app**:

- **Scenario:** Lateness and missed deadlines (Jordan, Project Coordinator, Northwind Logistics)
- **The employee (AI #1):** a hidden backstory (new caregiver for a parent) and a hidden openness level from 1 to 5
- **The coach (AI #2):** feedback after every turn (Strong / Okay / Needs work, why, and try instead), plus hidden 1–5 scores on six skills
- **Optional "Try instead":** learners can hide suggestions during the call and get them all in the debrief, to find their own way first
- **HR policy library:** four plain policy documents (HR-104 Attendance, HR-210 Flexible Work, HR-305 Leave and Accommodations, HR-410 EAP), available before and during the call
- **Manager toolkit:** conversation how-to, available before and after the call, but **hidden during it**
- **Debrief:** whether the real issue came out, whether a plan and follow-up were agreed, whether company policy was followed, two strengths, two growth areas, skill scores, a full transcript, a PDF, and a text download
- **Voice:** speak or type; the employee's replies are read aloud
- **Promo video:** `promo/promo.mp4` (40 seconds)

---

## Design principles (keep these as the library grows)

1. **Don't lead the learner.** Nothing in the policies or the toolkit should point at the hidden backstory: no highlighting, and sensitive topics appear only as one item in a list.
2. **Policies are rules; toolkits are how-to.** Policies are plain, formal documents. Toolkits hold the conversation skills.
3. **No answers during the call.** The toolkit describes what the coach scores, so it stays hidden while the conversation happens.
4. **The openness level stays hidden.** No mood meter. Learners read the person, not a gauge.
5. **Success means real-world outcomes:** the real issue surfaced, a plan was agreed with follow-up, and company policy was followed. Not saying the right words.
6. **Adding a scenario should be mostly writing, not code.**
7. **Let learners choose their level of support.** For example, "Try instead" can be hidden during the call, and is always in the debrief.

---

## Next up (from Steve's user test, November 2026)

- [ ] **Natural voice for Jordan (priority):** replace the robotic built-in browser voice with a natural-sounding voice service. This needs a voice service account and key, and adds a few cents per conversation.
- [ ] **Classroom (blended) version and facilitator guide:** about 10 minutes of framing (best practices: listening, open questions), then about 30 minutes where everyone practises with Jordan, then a group debrief on common themes. Peers share what worked, and the class discusses "who checked the policies?". Steve found in person better than online, because of learning from peers.
- [ ] **Jordan personality variations and employee profile:** draft ideas in `JORDAN-PROFILE-DRAFT.md`, to discuss (guarded, chatty, quiet, or defensive Jordan; a "Know your employee" prep card; consistent hidden details; Jordan's pronouns)
- [ ] **Class view for instructors:** everyone uses one class code; the instructor sees themes across the class (lowest skill, how many uncovered the real issue, how many opened the policies). Builds on the access codes and the learning data dashboard.
- [x] Coach panel on/off during the call (on by default); the coach still reviews everything silently when it's off
- [x] The debrief notes which HR policies the learner opened, before or during the call, and the coach names options they missed

## Phase 1: The library structure

- [ ] A home screen with a **scenario library** (cards showing the person, the situation, and the difficulty)
- [ ] The **HR policy library** and **manager toolkits** available from the home screen
- [ ] Each scenario in its own folder, built from a template:
  - scenario card (what the learner sees)
  - employee persona and hidden backstory (the prompt)
  - success criteria for the debrief (what the "real issue" is, and what a good plan looks like)
  - which toolkit applies
  - optional difficulty levels (for example, a lower starting openness)
- [ ] The coach, debrief, transcript, voice, and policy library shared across all scenarios
- [ ] Move Jordan into the new structure as scenario #1

## Phase 2: More conversations

Scenario ideas (Jasmin writes them, Claude helps with the persona and debrief criteria):

- [ ] **Burnout and overload:** a top performer who suddenly snaps at the team
- [ ] **Tone and teamwork:** an employee whose comments are upsetting colleagues
- [ ] **"You didn't get the promotion":** delivering disappointing news
- [ ] **Starting a performance improvement plan (PIP)**
- [ ] **Conflict between two team members**
- [ ] **Delivering a layoff**
- [ ] **Returning from leave:** a check-in that needs care

## Phase 3: Grow the policy library

Add policies as scenarios need them. A bigger library is also less leading, because learners have to find the policies that apply.

- [ ] Code of Conduct
- [ ] Anti-Harassment and Respectful Workplace
- [ ] Performance Management and Improvement Plans
- [ ] Promotions and Compensation
- [ ] Reduction in Force
- [ ] Remote and Hybrid Work (if it's split out from HR-210)

And more toolkits: delivering bad news, handling conflict, and difficult reactions (tears, anger, silence).

## Phase 4: Tracking and connections

- [ ] Progress tracking ("3 of 7 conversations completed"), which needs logins
- [ ] A SCORM package so it can be uploaded to any LMS, reporting completion, score, and pass/fail
- [ ] A Storyline connection: embed the simulator in a course (Web Object) and send results back to Storyline variables
- [ ] Optional xAPI for richer data (for example, "acknowledging emotions is our managers' weakest skill")
- [ ] A facilitator view: trainers review transcripts, with the learner's permission

---

## Smaller ideas parked for later

- [x] **Start screen order:** How it works → scenario → Before you start (policies, toolkit, switches) → Start call last

- [ ] **Skill scoring rubric (Jasmin):** a draft built from the manager toolkit is in `RUBRIC-DRAFT.md`, ready to review
- [ ] Calibration test: run a few scripted conversations (harsh, vague, excellent) and check the scores match an expert's
- [ ] Show progress on the debrief, not just averages. A draft exists on the `progress-view` branch; current leaning is to keep averages and add the rubric instead (see `RUBRIC-DRAFT.md`)
- [x] Stop saying "turn" in the app: moments are now quoted ("when you asked…") with plain timing words
- [ ] Turn on the access code in Vercel (`ACCESS_CODE`) and add the LinkedIn address in `public/contact.js`
- [ ] **Vercel Web Analytics (site visits):** switch it on in Vercel (project → Analytics → Enable), and Claude adds one line to the site. It counts visits, pages, countries, and devices, with no personal info.
- [ ] **Learning data dashboard** (build with the database for one-time codes): conversations started vs. finished; how often learners uncover the real issue, agree a plan, and follow policy; average skill scores; and which access code was used, when. No conversation text is stored.
- [ ] **One-time (limited-use) access codes:** each person gets their own code that works for a set number of conversations (for example, 1 for a recruiter, 3 for a friend). This needs a small free database on Vercel to remember used codes, and it shows who used their code and when. Build it together with turning on access codes. (A gentler option: the browser remembers a finished call, but that's easy to get around.)

- [ ] An iPhone + Chrome message: "For voice input on iPhone, open this page in Safari"
- [ ] A friendlier message when the API credit runs out
- [ ] Demo mode switched on by a special link (`?demo`) instead of for the whole site
- [x] Re-render the promo video with the new policy library design
- [ ] A one-page "How this scales for an organization" write-up for the portfolio
- [ ] A portfolio case study: the problem, design decisions, how it works, and what's next
- [ ] A playground copy of the project for experimenting safely

---

## Open questions

- Should learners choose the difficulty, or should it adapt to how they're doing?
- One shared toolkit with scenario-specific tips, or one toolkit per type of conversation?
- Should the debrief compare attempts ("you uncovered the issue two turns sooner than last time")? That needs saved history.
- Which company or industry should the fictional library represent as it grows? It's Northwind Logistics for now.
