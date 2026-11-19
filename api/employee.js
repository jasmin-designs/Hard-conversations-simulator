// AI #1: Jordan. Receives the conversation so far and returns Jordan's next line.

import { EMPLOYEE_PROMPT, EMPLOYEE_OUTPUT_RULES } from "../prompts/employee.js";
import { askClaude, readTranscript, handler, DEMO_MODE, RequestError } from "../lib/claude.js";
import { demoEmployee } from "../lib/demo.js";

export default handler(async (body) => {
  const transcript = readTranscript(body);
  if (transcript.at(-1).role !== "manager") {
    throw new RequestError(400, "bad_request", "Waiting for the manager to speak.");
  }
  if (DEMO_MODE) return { reply: demoEmployee(transcript) };

  // The manager is the "user" and Jordan is the "assistant". Back-to-back
  // lines from the same person are merged, since the API expects turns to alternate.
  const messages = [];
  for (const t of transcript) {
    const role = t.role === "manager" ? "user" : "assistant";
    const last = messages.at(-1);
    if (last && last.role === role) last.content += `\n${t.text}`;
    else messages.push({ role, content: t.text });
  }
  if (messages[0].role === "assistant") messages.unshift({ role: "user", content: "(The call connects.)" });

  const reply = await askClaude({
    system: `${EMPLOYEE_PROMPT}\n\n${EMPLOYEE_OUTPUT_RULES}`,
    messages,
    effort: "low",
    maxTokens: 2000,
  });
  return { reply };
});
