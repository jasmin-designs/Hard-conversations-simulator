# Notes for Claude

This project belongs to Jasmin, an instructional designer (not a developer). It's a portfolio piece that's growing into a practice library. **Read ROADMAP.md first** for the vision, the design principles, and what's next.

## Working with Jasmin
- Explain each step in plain language, with no jargon. She often works from her phone.
- She makes the design decisions. Ask when a choice changes the learning experience.
- Never ask her to paste API keys into chat. Keys live only in Vercel's Environment Variables.

## Project facts
- Live site: hard-conversations-simulator.vercel.app (Vercel auto-deploys on every push to `main`)
- GitHub: jasmin-designs/Hard-conversations-simulator
- Prompts: `prompts/employee.js` (Prompt 1, Jasmin's text, kept word for word) and `prompts/coach.js` (Prompt 2, likewise). App-specific technical notes are kept separate and clearly labeled.
- Policies: `public/policy.js` (plain policy documents, shared with the coach). Toolkit: `public/toolkit.js` (generic, hidden during the call). Profile: `public/profile.js` (Jordan, she/her; shared with Jordan's AI and the coach).
- Look: `public/theme.css` (Ocean & Citrus) loads after `public/styles.css`.
- Test without spending money: `npm run demo`, then drive it with Playwright.

## Design rules (from ROADMAP.md)
- Nothing in the policies or toolkit may hint at a scenario's hidden backstory: no highlighting, and sensitive items only appear inside neutral lists.
- The toolkit stays hidden during the call. The openness level is never shown.
- The toolkit stays generic (no scenario details). The profile never hints at the backstory. The profile is mentioned at most once in the debrief (never scored, never during the call).
