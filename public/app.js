// Everything that happens in the learner's browser: screens, speech, and
// sending the conversation to the server. The browser never sees the API key;
// it only talks to this site's own /api/... addresses.

import { SCENARIO } from "./scenario.js";
import { POLICY_LIBRARY } from "./policy.js";
import { TOOLKIT } from "./toolkit.js";
import { PROFILE } from "./profile.js";

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

// ---------- HR policy library and manager toolkit ----------
// One pop-up window shows either guide. Buttons say which with data-guide="policy" or "toolkit".
// The policy library opens as a list of policies; the toolkit is a single page.
const GUIDES = { policy: POLICY_LIBRARY, toolkit: TOOLKIT, profile: PROFILE };

function renderSections(sections) {
  $("guide-sections").replaceChildren();
  for (const section of sections) {
    const div = document.createElement("section");
    div.className = "policy-section";
    const h = document.createElement("h3");
    h.textContent = section.heading;
    const ul = document.createElement("ul");
    for (const point of section.points) {
      const li = document.createElement("li");
      li.textContent = point;
      ul.append(li);
    }
    div.append(h, ul);
    $("guide-sections").append(div);
  }
  $("guide-dialog").querySelector(".policy-body").scrollTop = 0;
}

// The policy library: a plain list of policies...
function showPolicyIndex(library) {
  if (phase() === "before") prepLog.libraryBefore = true;
  if (phase() === "during") prepLog.libraryDuring = true;
  $("guide-title").textContent = "All policies";
  $("guide-intro").textContent = "";
  const ul = document.createElement("ul");
  ul.className = "policy-index";
  library.policies.forEach((p, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = p.number;
    const ttl = document.createElement("span");
    ttl.className = "ttl";
    ttl.textContent = p.title;
    const date = document.createElement("span");
    date.className = "date";
    date.textContent = `Rev. ${p.revised}`;
    btn.append(num, ttl, date);
    btn.addEventListener("click", () => showPolicyDoc(library, i));
    li.append(btn);
    ul.append(li);
  });
  $("guide-sections").replaceChildren(ul);
  $("guide-dialog").querySelector(".policy-body").scrollTop = 0;
}

// ...and each policy as a plain document with numbered clauses.
function showPolicyDoc(library, index) {
  const p = library.policies[index];
  logPolicy(p.number);
  $("guide-title").textContent = `${p.number} ${p.title}`;
  $("guide-intro").textContent = "";

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back-link";
  back.textContent = "← All policies";
  back.addEventListener("click", () => showPolicyIndex(library));

  const doc = document.createElement("article");
  doc.className = "policy-doc";
  const h = document.createElement("h3");
  h.textContent = `${library.company} Policy ${p.number}: ${p.title}`;
  const table = document.createElement("table");
  for (const [k, v] of [
    ["Policy owner", p.owner],
    ["Applies to", p.appliesTo],
    ["Effective date", p.effective],
    ["Last revised", p.revised],
  ]) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = k;
    const td = document.createElement("td");
    td.textContent = v;
    tr.append(th, td);
    table.append(tr);
  }
  doc.append(h, table);

  const purpose = document.createElement("h4");
  purpose.textContent = "Purpose";
  const pp = document.createElement("p");
  pp.style.cssText = "padding-left:0;text-indent:0";
  pp.textContent = p.purpose;
  doc.append(purpose, pp);

  p.sections.forEach((section, i) => {
    const sh = document.createElement("h4");
    sh.textContent = `${i + 1}. ${section.heading}`;
    doc.append(sh);
    section.points.forEach((point, j) => {
      const para = document.createElement("p");
      const n = document.createElement("span");
      n.className = "clause-num";
      n.textContent = `${i + 1}.${j + 1}`;
      para.append(n, document.createTextNode(point));
      doc.append(para);
    });
  });

  $("guide-sections").replaceChildren(back, doc);
  $("guide-dialog").querySelector(".policy-body").scrollTop = 0;
}

function openGuide(guide) {
  if (guide === TOOLKIT && phase() === "before") prepLog.toolkitBefore = true;
  if (guide === PROFILE && phase() === "before") prepLog.profileBefore = true;
  $("guide-eyebrow").textContent = `${guide.company} · ${guide.label}`;
  $("guide-footnote").textContent = guide.footnote || "";
  if (guide.policies) {
    showPolicyIndex(guide);
  } else {
    $("guide-title").textContent = guide.title;
    $("guide-intro").textContent = guide.intro;
    renderSections(guide.sections);
  }
  $("guide-dialog").showModal();
}
for (const btn of document.querySelectorAll("[data-guide]")) {
  btn.addEventListener("click", () => openGuide(GUIDES[btn.dataset.guide]));
}
$("guide-close").addEventListener("click", () => $("guide-dialog").close());
$("guide-dialog").addEventListener("close", updatePrepCards);
$("guide-dialog").addEventListener("click", (e) => {
  if (e.target === $("guide-dialog")) $("guide-dialog").close(); // tap outside to close
});

// Summary line on the "Call settings" box, e.g. "Coach on · 'Try instead' on".
function updateSettingsState() {
  const el = document.getElementById("settings-state");
  if (!el) return;
  const coach = document.querySelector(".coach-toggle")?.checked ?? true;
  const tips = document.querySelector(".tips-toggle")?.checked ?? true;
  el.textContent = coach ? `Coach on · "Try instead" ${tips ? "on" : "off"}` : "Coach off (everything comes with your debrief)";
}

// ---------- "Try instead" on/off ----------
// On by default. Remembered on this device. Suggestions always appear in the debrief.
let showTips = true;
try { showTips = localStorage.getItem("showTips") !== "off"; } catch { /* storage unavailable: keep default */ }
function applyTips() {
  document.body.classList.toggle("tips-off", !showTips);
  for (const box of document.querySelectorAll(".tips-toggle")) box.checked = showTips;
  updateSettingsState();
}
for (const box of document.querySelectorAll(".tips-toggle")) {
  box.addEventListener("change", () => {
    showTips = box.checked;
    try { localStorage.setItem("showTips", showTips ? "on" : "off"); } catch { /* fine */ }
    applyTips();
  });
}
applyTips();

// ---------- Coach on/off during the call ----------
// On by default. Off = the coach still reviews everything silently, and it all shows in the debrief.
let showCoach = true;
try { showCoach = localStorage.getItem("showCoach") !== "off"; } catch { /* keep default */ }
function applyCoach() {
  document.body.classList.toggle("coach-off", !showCoach);
  for (const box of document.querySelectorAll(".coach-toggle")) box.checked = showCoach;
  $("coach-btn").setAttribute("aria-pressed", String(showCoach));
  $("coach-label").textContent = showCoach ? "Coach on" : "Coach off";
  updateSettingsState();
}
function setCoach(on) {
  showCoach = on;
  try { localStorage.setItem("showCoach", on ? "on" : "off"); } catch { /* fine */ }
  applyCoach();
}
for (const box of document.querySelectorAll(".coach-toggle")) box.addEventListener("change", () => setCoach(box.checked));
$("coach-btn").addEventListener("click", () => setCoach(!showCoach));
applyCoach();

// ---------- What the learner looked at (for the debrief) ----------
// Which HR policies were opened, and when: before, during, or after the call.
let prepLog = { policies: {}, libraryBefore: false, libraryDuring: false, toolkitBefore: false, profileBefore: false };
function phase() {
  if (!$("call-screen").hidden) return "during";
  if (!$("debrief-screen").hidden) return "after";
  return "before";
}
function logPolicy(number) {
  const when = phase();
  if (when === "after") return;
  prepLog.policies[number] = prepLog.policies[number] === "before" ? "before" : when;
}

// Mark the preparation cards once they've been opened, and update the reminder.
function updatePrepCards() {
  const done = {
    profile: prepLog.profileBefore,
    policy: Object.keys(prepLog.policies).length > 0 || prepLog.libraryBefore,
    toolkit: prepLog.toolkitBefore,
  };
  for (const [key, isDone] of Object.entries(done)) {
    const card = document.querySelector(`.prep-card[data-guide="${key}"]`);
    card.classList.toggle("done", isDone);
    card.querySelector(".prep-status").textContent = isDone ? "✓ Reviewed" : "Open →";
  }
  const names = { profile: "Jordan's profile", policy: "the HR policies", toolkit: "the manager toolkit" };
  const missing = Object.keys(done).filter((k) => !done[k]).map((k) => names[k]);
  const r = $("prep-reminder");
  r.hidden = missing.length === 0;
  const list = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} or ${missing.at(-1)}` : missing[0];
  r.textContent = `📋 Tip: you haven't opened ${list} yet.`;
}

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
async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
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

  // The coach's card appears now, but the coach waits for Jordan's reply,
  // so it can see how the message actually landed.
  const note = addPendingNote(turn, text);
  coachNotes.push(note);

  // AI #1: Jordan replies, then AI #2 (the coach) reviews.
  getReply(note);
}

// AI #2: the coach reviews the manager's message together with Jordan's reply.
function runCoach(note) {
  if (!note || note.requested) return;
  note.requested = true;
  note.el.lastElementChild.textContent = "Coach is reviewing…";
  const req = api("/api/coach", { transcript: transcript.slice() })
    .then((fb) => fillNote(note, fb))
    .catch((err) => failNote(note, err.message));
  coachRequests.push(req);
}

async function getReply(note) {
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
    runCoach(note);
  } catch (err) {
    typing.remove();
    $("call-avatar").className = "avatar avatar-lg";
    setStatus("");
    addRetry(err.message, note);
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

function addRetry(message, note) {
  const b = document.createElement("div");
  b.className = "bubble employee typing";
  b.textContent = `${message} `;
  const btn = document.createElement("button");
  btn.className = "btn btn-ghost";
  btn.style.cssText = "color:#eef3f5;box-shadow:inset 0 0 0 1.5px #9db0ba;padding:4px 12px;margin-top:6px";
  btn.textContent = "Retry";
  btn.onclick = () => { b.remove(); getReply(note); };
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
  el.innerHTML = `<p class="note-said"></p><p>Coach will review once Jordan responds…</p>`;
  el.querySelector(".note-said").textContent = `“${said.length > 140 ? said.slice(0, 140) + "…" : said}”`;
  $("coach-feed").prepend(el);
  return { status: "pending", turn, said, el, scores: {} };
}

function fillNote(note, fb) {
  Object.assign(note, fb, { status: "done" });
  const el = note.el;
  el.classList.remove("pending");

  // A greeting at the start: no rating yet.
  if (fb.verdict === "Warm-up") {
    el.classList.add("warmup");
    el.innerHTML = `<div class="note-top"><span class="note-turn">You said</span><span class="chip Warm-up">Warm-up</span></div><p class="note-said"></p><p class="note-why">👋 Warm-up noted. Your coach will rate your opener together with what you say next.</p>`;
    el.querySelector(".note-said").textContent = `“${note.said}”`;
    return;
  }

  // The message after a warm-up is rated together with it, as the opener.
  const prev = coachNotes[coachNotes.indexOf(note) - 1];
  const isOpener = prev?.verdict === "Warm-up";
  if (isOpener && !note.combined) {
    note.combined = true;
    note.said = `${prev.said} … ${note.said}`;
  }
  el.innerHTML = `
    <div class="note-top"><span class="note-turn"></span><span class="chip"></span></div>
    <p class="note-said"></p>
    <p class="note-why"></p>`;
  el.querySelector(".note-turn").textContent = isOpener ? "Your opener" : "You said";
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
    const saved = document.createElement("p");
    saved.className = "note-saved";
    saved.textContent = "💡 Suggestion saved for your debrief.";
    el.append(t, saved);
  }
}

function failNote(note, message) {
  note.status = "error";
  note.el.classList.add("pending");
  note.el.lastElementChild.textContent = `Coach feedback isn't available for this one. (${message})`;
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
// Ask before ending, so one accidental tap doesn't end the conversation.
$("end-btn").addEventListener("click", () => {
  const managerTurns = transcript.filter((t) => t.role === "manager").length;
  if (managerTurns === 0) return endCall();
  $("confirm-dialog").showModal();
});
$("confirm-keep").addEventListener("click", () => $("confirm-dialog").close());
$("confirm-end").addEventListener("click", () => {
  $("confirm-dialog").close();
  endCall();
});

function endCall() {
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
  // Anything the coach hasn't reviewed yet (Jordan never replied) gets reviewed now.
  for (const n of coachNotes) runCoach(n);
  show("debrief-screen");
  loadDebrief();
}

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
      policyUse: policyUse(),
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
  $("debrief-meta").textContent = `${durationText} · you spoke ${turns} time${turns === 1 ? "" : "s"}`;
  $("debrief-overall").textContent = d.overall;

  setOutcome(
    "outcome-issue",
    d.uncoveredRealIssue ? "yes" : "no",
    d.uncoveredRealIssue ? "Yes" : "Not yet",
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
  // Which policies they actually opened (counted by the app, not the AI).
  const policyBox = $("outcome-policy").querySelector(".outcome-note").parentElement;
  policyBox.querySelector(".policy-check")?.remove();
  const check = document.createElement("p");
  check.className = "policy-check";
  check.textContent = policyUseText(policyUse());
  policyBox.append(check);

  fillList("debrief-strengths", d.strengths);

  // Every "Try instead" from the call, whether or not it was shown during it.
  const tries = coachNotes.filter((n) => n.tryInstead);
  $("debrief-tries").replaceChildren();
  $("debrief-tries-card").hidden = tries.length === 0;
  for (const n of tries) {
    const item = document.createElement("div");
    item.className = "try-item";
    const turnEl = document.createElement("span");
    turnEl.className = "try-turn";
    turnEl.textContent = n.verdict;
    const said = document.createElement("p");
    said.className = "try-said";
    said.textContent = `You said: “${n.said}”`;
    const next = document.createElement("p");
    next.className = "try-new";
    next.innerHTML = "<strong>Try instead: </strong>";
    next.append(document.createTextNode(`“${n.tryInstead}”`));
    item.append(turnEl, said, next);
    $("debrief-tries").append(item);
  }
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
      who.textContent = "You";
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
      c.textContent = `Coach: ${note.why}`; // "Try instead" lives in its own card above
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

$("again-btn").addEventListener("click", () => {
  prepLog = { policies: {}, libraryBefore: false, libraryDuring: false, toolkitBefore: false, profileBefore: false };
  updatePrepCards();
  show("start-screen");
});

// A plain summary of which policies were opened, and when.
function policyUse() {
  const before = Object.keys(prepLog.policies).filter((k) => prepLog.policies[k] === "before");
  const during = Object.keys(prepLog.policies).filter((k) => prepLog.policies[k] === "during");
  return { before, during, toolkitBefore: prepLog.toolkitBefore };
}
function policyUseText(u) {
  const parts = [];
  if (u.before.length) parts.push(`${u.before.join(", ")} before the call`);
  if (u.during.length) parts.push(`${u.during.join(", ")} during the call`);
  return parts.length ? `📋 Policies you opened: ${parts.join("; ")}.` : "📋 You didn't open any HR policies.";
}
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
    `Length: ${durationText}, you spoke ${coachNotes.length} times`,
    "",
    "CONVERSATION",
    line,
  ];

  let turn = 0;
  for (const t of transcript) {
    if (t.role === "manager") {
      const note = coachNotes[turn++];
      out.push("", `YOU: ${t.text}`);
      if (note?.verdict) {
        out.push(`   Coach: ${note.verdict}. ${note.why}`);
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
      `Uncovered the real issue: ${d.uncoveredRealIssue ? "Yes" : "Not yet"}`,
      `   ${d.realIssueNote}`,
      `Agreed a plan: ${yesNo(d.planAgreed)} · Follow-up agreed: ${yesNo(d.followUpAgreed)}`,
      `   ${d.planNote}`,
      `Followed company policy: ${d.policyAligned ? "Yes" : "Not fully"}`,
      `   ${d.policyNote || ""}`,
      `   ${policyUseText(policyUse()).replace("📋 ", "")}`,
      "",
      "What you did well:",
      ...(d.strengths || []).map((s) => `  - ${s}`),
      "",
      "Where to grow:",
      ...(d.growthAreas || []).map((s) => `  - ${s}`),
      "",
      ...(coachNotes.some((n) => n.tryInstead)
        ? [
            "Try instead: phrasings to practice:",
            ...coachNotes
              .filter((n) => n.tryInstead)
              .flatMap((n) => [`  - You said: "${n.said}"`, `    Try instead: "${n.tryInstead}"`]),
            "",
          ]
        : []),
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
