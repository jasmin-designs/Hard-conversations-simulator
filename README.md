# Hard Conversations Simulator

A practice tool for managers. You hold a feedback conversation with Jordan, an AI employee who has been late and missed deadlines. Jordan reacts the way a real person would. A coach reviews every turn you take, and you get a debrief at the end.

*An instructional design portfolio piece by Jasmin.*

---

## How the app is built (plain-language tour)

Think of the app as two halves:

| Half | Where it runs | What it does |
|---|---|---|
| **The website** (`public/` folder) | In the learner's browser | Shows the screens, listens to the mic, reads Jordan's replies aloud |
| **The back office** (`api/` folder) | On Vercel's servers | Holds your API key and calls Claude |

The browser never sees your API key. It only sends the conversation to your own site's back office, and the back office calls Claude.

**Each time the learner speaks, two Claude calls run at the same time:**

1. `api/employee.js` sends the conversation to Claude with **Prompt 1**, and Claude replies as Jordan.
2. `api/coach.js` sends the conversation to Claude with **Prompt 2**, and Claude returns the verdict, the "why", a "try instead", and the hidden scores.

When the learner clicks **End call**, `api/debrief.js` sends the whole transcript plus every hidden score to the coach, which writes the debrief. The skill bars on the debrief screen average those hidden scores. Jordan's openness level stays inside Jordan's head; it's never sent to the screen.

### Where things live

```
prompts/employee.js   ← Prompt 1 (Jordan). Edit this to change Jordan.
prompts/coach.js      ← Prompt 2 (the coach). Edit this to change the coaching.
public/scenario.js    ← The scenario text on the start screen.
public/index.html     ← The three screens (start, call, debrief).
public/styles.css     ← Colors, fonts, layout.
public/app.js         ← Screen behavior, mic, and voice.
api/                  ← The three back-office functions.
lib/claude.js         ← Shared code that calls Claude.
lib/demo.js           ← Canned replies for demo mode.
```

Both of your prompts are already in place, word for word. Each prompt file also contains a short, clearly labeled **technical note** that the app adds:
- **Jordan:** "spoken words only, no stage directions", so the voice doesn't read out "*sighs*".
- **Coach:** exact labels for the verdict and score lines, so the app can reliably read the coach's reply.

---

## Step 1: Get an Anthropic API key

1. Go to **console.anthropic.com** and sign up.
2. Under **Billing**, add a payment method and buy a small amount of credit ($5–$10 covers a lot of practice calls).
3. Under **Limits**, set a monthly spend limit. That's your safety net if the site gets heavy traffic.
4. Under **API Keys**, click **Create Key**, name it "hard-conversations", and copy it. It starts with `sk-ant-`. Keep it private: don't paste it into chat, email, or any file in this project.

## Step 2: Put the code on GitHub

Vercel deploys straight from GitHub. If Claude Code has already pushed the code to your repository, skip this step.

## Step 3: Deploy on Vercel

1. Go to **vercel.com** and choose **Sign up → Continue with GitHub**. The free Hobby plan is fine.
2. Click **Add New… → Project**, find `hard-conversations-simulator`, and click **Import**.
3. Leave **Framework Preset** as **Other**, and leave the build settings as they are.
4. Open **Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY` · **Value:** your key from Step 1
5. Click **Deploy**. About a minute later you'll get a link like `hard-conversations-simulator.vercel.app`. That's your portfolio link.

Every later change you push to GitHub redeploys the site automatically.

### Optional settings (Vercel → your project → Settings → Environment Variables)

| Name | What it does |
|---|---|
| `ACCESS_CODE` | Requires a password before anyone can use the AI. Useful if you share the link widely and want to control cost. Visitors are asked for the code once. |
| `MODEL` | Which Claude model to use. Default: `claude-opus-5-5`. |
| `DEMO_MODE` | Set to `1` to use canned replies (no AI, no cost). Handy for a demo that can't fail. |

After changing a variable, go to **Deployments → ⋯ → Redeploy** so it takes effect.

---

## Trying it on your own computer (optional)

You only need this if you want to preview changes before deploying.

1. Install **Node.js** (the "LTS" version) from nodejs.org.
2. Open a terminal in this folder and run `npm install` once.
3. Run one of these:
   - `npm run demo` (canned replies, no key needed)
   - `npm run dev` (real AI; first create a file named `.env` in this folder containing `ANTHROPIC_API_KEY=sk-ant-...`)
4. Open **http://localhost:3000** in Chrome.

The `.env` file is already listed in `.gitignore`, so it is never uploaded to GitHub.

---

## Good to know

- **Voice input** (the mic button) uses the browser's built-in speech recognition. It works in **Chrome, Edge, and Safari**. Firefox users can type. The browser asks for microphone permission the first time.
- **Jordan's voice** uses the computer's built-in voices, so it sounds different on a Mac, Windows, or a phone. Learners can mute it with the **Voice on/off** button.
- **Cost:** each learner turn makes two short AI calls, and the debrief makes one more. A typical 8-turn practice call costs a few cents.
- **Limits:** each message is capped at 1,500 characters and each conversation at 60 messages, so nobody can run up a large bill through your site.
- **Adding a scenario later:** change `public/scenario.js` (what the learner sees) and `prompts/employee.js` (how the employee behaves). Claude Code can turn this into a scenario picker whenever you're ready.
