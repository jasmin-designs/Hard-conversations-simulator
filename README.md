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

**The HR policy and manager toolkit.** Two separate resources, like a real company has. The **HR policy library** (four separate policies: attendance, flexible work, leave and accommodations, and the employee assistance program) is available on the start screen and during the call, and the coach checks the manager's approach against it. The **manager toolkit** (how to have the conversation, with phrases that help and phrases to avoid) is available before the call to prepare and after it on the debrief screen, but hidden during the call, because it describes the skills the coach is scoring. Nothing in either guide is highlighted, and caregiving appears only as one item in a list, so neither hints at Jordan's hidden backstory. Jordan never sees either. To adapt them for another company, edit `public/policy.js` and `public/toolkit.js`.

When the learner clicks **End call**, `api/debrief.js` sends the whole transcript plus every hidden score to the coach, which writes the debrief. The skill bars on the debrief screen average those hidden scores. Jordan's openness level stays inside Jordan's head; it's never sent to the screen.

### Where things live

```
prompts/employee.js   ← Prompt 1 (Jordan). Edit this to change Jordan.
prompts/coach.js      ← Prompt 2 (the coach). Edit this to change the coaching.
public/scenario.js    ← The scenario text on the start screen.
public/policy.js      ← The HR policy library (fictional "Northwind Logistics"): four separate policies.
public/toolkit.js     ← The manager toolkit: generic how-to for any performance conversation.
public/profile.js     ← "Know your employee": what the manager knows about Jordan (she/her).
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
| `ELEVENLABS_API_KEY` | Turns on a natural, realistic voice for Jordan (from elevenlabs.io). Without it, Jordan uses the browser's built-in voice. |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice plays Jordan. Copy the voice ID from your ElevenLabs voice library. |
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

- **Voice input** (the mic button) uses the browser's built-in speech recognition. On computers it works in **Chrome, Edge, and Safari**. On iPhones it only works in **Safari**. Firefox users can type. The browser asks for microphone permission the first time.
- **Jordan's voice** uses the computer's built-in voices, so it sounds different on a Mac, Windows, or a phone. Learners can mute it with the **Voice on/off** button.
- **Cost:** each learner turn makes two AI calls, and the debrief makes one more. In real testing, 8 practice conversations cost $0.68 in total, about 9 cents each (longer conversations cost a little more). To lower it, set the `MODEL` variable to `claude-sonnet-5-5` (about half the cost).
- **Limits:** each message is capped at 1,500 characters and each conversation at 60 messages, so nobody can run up a large bill through your site.
- **The coach can be hidden during the call:** "Show the coach during the call" (on by default) on the start screen, or the **Coach on/off** button in the call. When it's off, the call fills the screen like a real conversation, and everything the coach noticed appears in the debrief.
- **Policy check:** the debrief shows which HR policies the learner opened, before or during the call, and the coach names options they could have used.
- **"Try instead" is optional:** learners can turn off the coach's suggested phrasings during the call (on the start screen or in the coach panel). The verdict and "why" still appear, and every suggestion appears in the debrief's conversation review, next to what was said. The choice is remembered on that device.
- **Transcripts:** the debrief screen has a **Download transcript** button (a text file with the conversation, the coach's notes, and the debrief) and a **Save as PDF** button.
- **Adding a scenario later:** change `public/scenario.js` (what the learner sees) and `prompts/employee.js` (how the employee behaves). Claude Code can turn this into a scenario picker whenever you're ready.
