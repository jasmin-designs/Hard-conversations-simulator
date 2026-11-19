// Everything that happens in the learner's browser: screens, speech, and
// sending the conversation to the server. The browser never sees the API key;
// it only talks to this site's own /api/... addresses.

import { SCENARIO } from "./scenario.js";
import { POLICY } from "./policy.js";

// Same six skills as prompts/coach.js (labels shown on the debrief).
const SKILLS = {
  tone: "Respectful tone",
  specifics: "Specific behavior and impact",
  questions: "Open questions and listening",
  emotions: "Acknowledging emotions",
  focus: "Staying on topic",
  plan: "Clear, shared plan with follow-up",
};

const $ = (id) => document.getElementById(id);
const name = SCENARIO.employeeName;

// ---------- Conversation state ----------
let transcript = []; // [{ role: "manager" | "employee", text }]
let coachNotes = []; // one per manager turn: { status, verdict, why, tryInstead, scores, el }
let coachRequests = [];
let busy = false;
let startedAt = 0;
let timerId = null;
let voiceOn = true;

// ---------- Start screen ----------
$("start-avatar").textContent = name[0];
$("call-avatar").textContent = name[0];
$("call-name").textContent = name;
$("scenario-title").textContent = SCENARIO.title;
$("scenario-role").textContent = `${name} · ${SCENARIO.employeeRole}`;
$("scenario-summary").textContent = SCENARIO.summary;
$("scenario-goal").textContent = SCENARIO.goal;
for (const d of SCENARIO.details) {
  const li = document.createElement("li");
  li.textContent = d;
  $("scenario-details").append(li);
}
$("message").placeholder = `Say something to ${name}…`;

// ---------- Policy job aid ----------
$("policy-company").textContent = POLICY.company;
$("policy-title").textContent = POLICY.title;
$("policy-intro").textContent = POLICY.intro;
for (const section of POLICY.sections) {
  const div = document.createElement("section");
  div.className = `policy-section${/HR/.test(section.heading) ? " hr" : ""}`;
  const h = document.createElement("h3");
  h.textContent = section.heading;
  const ul = document.createElement("ul");
  for (const point of section.points) {
    const li = document.createElement("li");
    li.textContent = point;
    ul.append(li);
  }
  div.append(h, ul);
  $("policy-sections").append(div);
}
for (const btn of document.querySelectorAll(".policy-open")) {
  btn.addEventListener("click", () => $("policy-dialog").showModal());
}
$("policy-close").addEventListener("click", () => $("policy-dialog").close());
$("policy-dialog").addEventListener("click", (e) => {
  if (e.target === $("policy-dialog")) $("policy-dialog").close(); // tap outside to close
});

function show(screen) {
  for (const id of ["start-screen", "call-screen", "debrief-screen"]) $(id).hidden = id !== screen;
  window.scrollTo(0, 0);
}

$("start-btn").addEventListener("click", () => {
  resetConversation();
  // Browsers only allow speech that starts from a click, so "unlock" it now.
  if ("speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  show("call-screen");
  startedAt = Date.now();
  timerId = setInterval(updateTimer, 1000);
  updateTimer();
  setStatus(`Connected with ${name}. You start the conversation.`);
  $("message").focus();
});

function resetConversation() {
  transcript = [];
  coachNotes = [];
  coachRequests = [];
  busy = false;
  $("transcript").replaceChildren();
  $("coach-feed").replaceChildren($("coach-empty"));
  $("coach-empty").hidden = false;
  $("message").value = "";
  $("send-btn").disabled = false;
  $("mic-btn").disabled = false;
}

function updateTimer() {
  $("call-timer").textContent = formatTime(Date.now() - startedAt);
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function setStatus(text) {
  $("stage-status").textContent = text;
}

// ---------- Talking to the server ----------
async function api(path, body, retried = false) {
  const headers = { "Content-Type": "application/json" };
  const code = sessionGet("accessCode");
  if (code) headers["x-access-code"] = code;
  const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.code === "access_code_required" && !retried) {
    const entered = window.prompt("This simulator needs an access code. Enter it to continue:");
    if (entered) {
      sessionSet("accessCode", entered.trim());
      return api(path, body, true);
    }
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}
function sessionGet(k) {
  try { return sessionStorage.getItem(k); } catch { return null; }
}
function sessionSet(k, v) {
  try { sessionStorage.setItem(k, v); } catch { /* private mode: fine */ }
}

function toast(text) {
  const t = $("toast");
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 5000);
}

// ---------- One turn of the conversation ----------
$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  if (listening) recognition.stop(); // sending happens when the mic finishes
  else sendTurn($("message").value);
});

function sendTurn(raw) {
  const text = raw.trim();
  if (!text || busy) return;
  $("message").value = "";
  stopSpeaking();

  transcript.push({ role: "manager", text });
  addBubble("manager", text);
  const turn = transcript.filter((t) => t.role === "manager").length;

  // AI #2: the coach reviews this turn (runs at the same time as Jordan's reply).
  const note = addPendingNote(turn, text);
  coachNotes.push(note);
  const req = api("/api/coach", { transcript: transcript.slice() })
    .then((fb) => fillNote(note, fb))
    .catch((err) => failNote(note, err.message));
  coachRequests.push(req);

  // AI #1: Jordan replies.
  getReply();
}

async function getReply() {
  busy = true;
  $("send-btn").disabled = true;
  $("mic-btn").disabled = true;
  const typing = addBubble("employee", "", { typing: true });
  $("call-avatar").className = "avatar avatar-lg thinking";
  setStatus(`${name} is thinking…`);

  try {
    const { reply } = await api("/api/employee", { transcript });
    typing.remove();
    transcript.push({ role: "employee", text: reply });
    addBubble("employee", reply);
    setStatus("");
    $("call-avatar").className = "avatar avatar-lg";
    speak(reply);
  } catch (err) {
    typing.remove();
    $("call-avatar").className = "avatar avatar-lg";
    setStatus("");
    addRetry(err.message);
  } finally {
    busy = false;
    $("send-btn").disabled = false;
    $("mic-btn").disabled = false;
  }
}

function addBubble(role, text, { typing = false } = {}) {
  const b = document.createElement("div");
  b.className = `bubble ${role}${typing ? " typing" : ""}`;
  const who = document.createElement("span");
  who.className = "who";
  who.textContent = role === "manager" ? "You" : name;
  b.append(who);
  if (typing) {
    const dots = document.createElement("span");
    dots.className = "dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    b.append(dots);
  } else {
    b.append(document.createTextNode(text));
  }
  $("transcript").append(b);
  b.scrollIntoView({ block: "end", behavior: "smooth" });
  return b;
}

function addRetry(message) {
  const b = document.createElement("div");
  b.className = "bubble employee typing";
  b.textContent = `${message} `;
  const btn = document.createElement("button");
  btn.className = "btn btn-ghost";
  btn.style.cssText = "color:#eef3f5;box-shadow:inset 0 0 0 1.5px #9db0ba;padding:4px 12px;margin-top:6px";
  btn.textContent = "Retry";
  btn.onclick = () => { b.remove(); getReply(); };
  b.append(document.createElement("br"), btn);
  $("transcript").append(b);
  b.scrollIntoView({ block: "end" });
}

// ---------- Coach panel ----------
function addPendingNote(turn, said) {
  $("coach-empty").hidden = true;
  for (const n of $("coach-feed").querySelectorAll(".note")) n.classList.remove("latest");
  const el = document.createElement("article");
  el.className = "note pending latest";
  el.innerHTML = `<div class="note-top"><span class="note-turn"></span></div><p class="note-said"></p><p>Coach is reviewing…</p>`;
  el.querySelector(".note-turn").textContent = `Turn ${turn}`;
  el.querySelector(".note-said").textContent = `“${said.length > 140 ? said.slice(0, 140) + "…" : said}”`;
  $("coach-feed").prepend(el);
  return { status: "pending", turn, said, el, scores: {} };
}

function fillNote(note, fb) {
  Object.assign(note, fb, { status: "done" });
  const el = note.el;
  el.classList.remove("pending");
  el.innerHTML = `
    <div class="note-top"><span class="note-turn"></span><span class="chip"></span></div>
    <p class="note-said"></p>
    <p class="note-why"></p>`;
  el.querySelector(".note-turn").textContent = `Turn ${note.turn}`;
  const chip = el.querySelector(".chip");
  chip.textContent = fb.verdict;
  chip.classList.add(fb.verdict.split(" ")[0]);
  el.querySelector(".note-said").textContent = `“${note.said.length > 140 ? note.said.slice(0, 140) + "…" : note.said}”`;
  el.querySelector(".note-why").textContent = fb.why;
  if (fb.tryInstead) {
    const t = document.createElement("p");
    t.className = "note-try";
    t.innerHTML = "<strong>Try instead</strong>";
    t.append(document.createTextNode(`“${fb.tryInstead}”`));
    el.append(t);
  }
}

function failNote(note, message) {
  note.status = "error";
  note.el.classList.add("pending");
  note.el.lastElementChild.textContent = `Coach feedback unavailable for this turn. (${message})`;
}

// ---------- Text-to-speech (Jordan's voice) ----------
let voice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang?.startsWith("en"));
  const preferred = ["Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Alex"];
  voice =
    preferred.map((p) => voices.find((v) => v.name.includes(p))).find(Boolean) ||
    voices.find((v) => v.lang === "en-US") ||
    voices[0] ||
    null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
} else {
  $("voice-toggle").hidden = true;
}

function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 1;
  const avatar = $("call-avatar");
  u.onstart = () => avatar.classList.add("speaking");
  u.onend = u.onerror = () => avatar.classList.remove("speaking");
  speechSynthesis.speak(u);
}
function stopSpeaking() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  $("call-avatar").classList.remove("speaking");
}

$("voice-toggle").addEventListener("click", () => {
  voiceOn = !voiceOn;
  $("voice-toggle").setAttribute("aria-pressed", String(voiceOn));
  $("voice-label").textContent = voiceOn ? "Voice on" : "Voice off";
  if (!voiceOn) stopSpeaking();
});

// ---------- Speech-to-text (the learner's mic) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if (!SpeechRecognition) {
  $("mic-btn").hidden = true;
  $("mic-note").hidden = false;
  $("mic-note").textContent = "Voice input isn't supported in this browser. Type instead, or use Chrome, Edge, or Safari.";
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (e) => {
    let text = "";
    for (const r of e.results) text += r[0].transcript;
    $("message").value = text;
  };
  recognition.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      // Reset the mic button right away (some browsers never fire "end" here).
      listening = false;
      $("mic-btn").setAttribute("aria-pressed", "false");
      $("message").placeholder = `Say something to ${name}…`;
      toast("Microphone access is blocked. Allow it in your browser or phone settings, or type instead.");
    } else if (e.error !== "no-speech" && e.error !== "aborted") {
      toast(`Voice input stopped (${e.error}). You can type instead.`);
    }
  };
  recognition.onend = () => {
    listening = false;
    $("mic-btn").setAttribute("aria-pressed", "false");
    $("message").placeholder = `Say something to ${name}…`;
    if (!$("call-screen").hidden) sendTurn($("message").value);
  };

  $("mic-btn").addEventListener("click", () => {
    if (listening) return recognition.stop(); // stop and send
    stopSpeaking(); // don't let the mic hear Jordan
    $("message").value = "";
    try {
      recognition.start();
      listening = true;
      $("mic-btn").setAttribute("aria-pressed", "true");
      $("message").placeholder = "Listening… tap the mic again to send";
    } catch {
      /* already started */
    }
  });
}

// ---------- End call and debrief ----------
$("end-btn").addEventListener("click", () => {
  if (listening) recognition.abort();
  stopSpeaking();
  clearInterval(timerId);
  const managerTurns = transcript.filter((t) => t.role === "manager").length;
  if (managerTurns === 0) {
    show("start-screen");
    return;
  }
  const lastEmployeePending = busy;
  if (lastEmployeePending) toast(`Ending the call before ${name} replied.`);
  show("debrief-screen");
  loadDebrief();
});

let durationText = "";
async function loadDebrief() {
  durationText = formatTime(Date.now() - startedAt);
  $("debrief-loading").hidden = false;
  $("debrief-error").hidden = true;
  $("debrief-body").hidden = true;

  await Promise.allSettled(coachRequests); // make sure every turn has its scores
  try {
    const data = await api("/api/debrief", {
      transcript,
      turnScores: coachNotes.map((n) => n.scores || {}),
    });
    renderDebrief(data);
  } catch (err) {
    $("debrief-loading").hidden = true;
    $("debrief-error").hidden = false;
    $("debrief-error-text").textContent = err.message;
  }
}
$("debrief-retry").addEventListener("click", loadDebrief);

let lastDebrief = null;

function renderDebrief(d) {
  lastDebrief = d;
  $("debrief-loading").hidden = true;
  $("debrief-body").hidden = false;

  const turns = coachNotes.length;
  $("debrief-meta").textContent = `${turns} turn${turns === 1 ? "" : "s"} · ${durationText}`;
  $("debrief-overall").textContent = d.overall;

  setOutcome(
    "outcome-issue",
    d.uncoveredRealIssue ? "yes" : "no",
    d.uncoveredRealIssue ? (d.uncoveredOnTurn ? `Yes, on turn ${d.uncoveredOnTurn}` : "Yes") : "Not yet",
    d.realIssueNote
  );
  const planState = d.planAgreed && d.followUpAgreed ? "yes" : d.planAgreed ? "partial" : "no";
  setOutcome(
    "outcome-plan",
    planState,
    { yes: "Yes", partial: "Plan, but no follow-up", no: "Not yet" }[planState],
    d.planNote
  );

  setOutcome(
    "outcome-policy",
    d.policyAligned ? "yes" : "no",
    d.policyAligned ? "Yes" : "Not fully",
    d.policyNote
  );

  fillList("debrief-strengths", d.strengths);
  fillList("debrief-growth", d.growthAreas);

  // Skill averages from the coach's hidden per-turn scores.
  const skills = $("debrief-skills");
  skills.replaceChildren();
  for (const [key, label] of Object.entries(SKILLS)) {
    const vals = coachNotes.map((n) => n.scores?.[key]).filter((v) => typeof v === "number");
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const row = document.createElement("div");
    row.className = `skill${avg === null ? " untouched" : ""}`;
    row.innerHTML = `<span class="skill-name"></span><div class="skill-bar"><div class="skill-fill"></div></div><span class="skill-num"></span>`;
    row.querySelector(".skill-name").textContent = label;
    row.querySelector(".skill-fill").style.width = avg === null ? "0" : `${(avg / 5) * 100}%`;
    row.querySelector(".skill-num").textContent = avg === null ? "—" : avg.toFixed(1);
    if (avg === null) row.title = "Not used in this conversation";
    skills.append(row);
  }

  // Full transcript with the coach's verdict beside each of your turns.
  const review = $("debrief-transcript");
  review.replaceChildren();
  let turn = 0;
  for (const t of transcript) {
    const line = document.createElement("div");
    line.className = "review-line";
    const who = document.createElement("div");
    who.className = "review-who";
    if (t.role === "manager") {
      const note = coachNotes[turn++];
      who.textContent = `You · turn ${turn}`;
      if (note?.verdict) {
        const chip = document.createElement("span");
        chip.className = `chip ${note.verdict.split(" ")[0]}`;
        chip.textContent = note.verdict;
        who.append(chip);
      }
    } else {
      who.textContent = name;
    }
    const p = document.createElement("p");
    p.textContent = t.text;
    line.append(who, p);
    // The coach's note for this turn, under what you said.
    const note = t.role === "manager" ? coachNotes[turn - 1] : null;
    if (note?.why) {
      const c = document.createElement("p");
      c.className = "review-coach";
      c.textContent = `Coach: ${note.why}`;
      if (note.tryInstead) {
        const tip = document.createElement("em");
        tip.textContent = ` Try instead: “${note.tryInstead}”`;
        c.append(tip);
      }
      line.append(c);
    }
    review.append(line);
  }
}

function setOutcome(id, state, value, note) {
  const el = $(id);
  el.className = `outcome ${state}`;
  el.querySelector(".outcome-value").textContent = value;
  el.querySelector(".outcome-note").textContent = note || "";
}
function fillList(id, items = []) {
  const ul = $(id);
  ul.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.append(li);
  }
}

$("again-btn").addEventListener("click", () => show("start-screen"));
$("print-btn").addEventListener("click", () => window.print());

// Show the full conversation in the PDF, then put things back afterwards.
let reviewWasOpen = false;
window.addEventListener("beforeprint", () => {
  reviewWasOpen = $("debrief-transcript").parentElement.open;
  $("debrief-transcript").parentElement.open = true;
});
window.addEventListener("afterprint", () => {
  $("debrief-transcript").parentElement.open = reviewWasOpen;
});

// ---------- Download the transcript as a text file ----------
$("download-btn").addEventListener("click", () => {
  const text = buildTranscript(lastDebrief);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hard-conversation-${name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function buildTranscript(d) {
  const line = "=".repeat(60);
  const out = [
    "HARD CONVERSATIONS SIMULATOR: PRACTICE TRANSCRIPT",
    line,
    `Scenario: ${SCENARIO.title}`,
    SCENARIO.summary,
    `Date: ${new Date().toLocaleString()}`,
    `Length: ${coachNotes.length} turns, ${durationText}`,
    "",
    "CONVERSATION",
    line,
  ];

  let turn = 0;
  for (const t of transcript) {
    if (t.role === "manager") {
      const note = coachNotes[turn++];
      out.push("", `YOU (turn ${turn}): ${t.text}`);
      if (note?.verdict) {
        out.push(`   Coach: ${note.verdict}. ${note.why}`);
        if (note.tryInstead) out.push(`   Try instead: "${note.tryInstead}"`);
      }
    } else {
      out.push("", `${name.toUpperCase()}: ${t.text}`);
    }
  }

  if (d) {
    const yesNo = (v) => (v ? "Yes" : "Not yet");
    out.push(
      "",
      "",
      "DEBRIEF",
      line,
      d.overall,
      "",
      `Uncovered the real issue: ${d.uncoveredRealIssue ? (d.uncoveredOnTurn ? `Yes, on turn ${d.uncoveredOnTurn}` : "Yes") : "Not yet"}`,
      `   ${d.realIssueNote}`,
      `Agreed a plan: ${yesNo(d.planAgreed)} · Follow-up agreed: ${yesNo(d.followUpAgreed)}`,
      `   ${d.planNote}`,
      `Followed company policy: ${d.policyAligned ? "Yes" : "Not fully"}`,
      `   ${d.policyNote || ""}`,
      "",
      "What you did well:",
      ...(d.strengths || []).map((s) => `  - ${s}`),
      "",
      "Where to grow:",
      ...(d.growthAreas || []).map((s) => `  - ${s}`),
      "",
      "Skill scores (average, 1-5):"
    );
    for (const [key, label] of Object.entries(SKILLS)) {
      const vals = coachNotes.map((n) => n.scores?.[key]).filter((v) => typeof v === "number");
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "not used";
      out.push(`  - ${label}: ${avg}`);
    }
  }
  return out.join("\n") + "\n";
}
