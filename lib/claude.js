// Shared server-side helpers. This file runs on Vercel's servers, never in the
// learner's browser, which is why the API key is safe here.

import Anthropic from "@anthropic-ai/sdk";

// Model used for all three AI calls. Override with the MODEL environment variable.
export const MODEL = process.env.MODEL || "claude-opus-5-5";

export const DEMO_MODE = process.env.DEMO_MODE === "1";

let client;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

// Limits that stop anyone from running up a big bill through your public site.
const MAX_TURNS = 60; // total messages in one conversation
const MAX_CHARS = 1500; // per message

export class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Checks the conversation the browser sent and returns a clean copy. */
export function readTranscript(body) {
  const transcript = body?.transcript;
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new RequestError(400, "bad_request", "The conversation is empty.");
  }
  if (transcript.length > MAX_TURNS) {
    throw new RequestError(
      400,
      "too_long",
      "This conversation has reached its length limit. End the call to see your debrief."
    );
  }
  return transcript.map((t) => {
    if (!t || (t.role !== "manager" && t.role !== "employee") || typeof t.text !== "string") {
      throw new RequestError(400, "bad_request", "The conversation format is invalid.");
    }
    return { role: t.role, text: t.text.trim().slice(0, MAX_CHARS) };
  });
}

/** Formats the conversation as a readable script (for the coach). No numbers, so the coach quotes moments instead. */
export function asScript(transcript, employeeName = "Jordan") {
  return transcript.map((t) => `${t.role === "manager" ? "Manager" : employeeName}: ${t.text}`).join("\n");
}

/**
 * One call to Claude. Returns the response's text, or JSON when `schema` is given.
 * Uses server-side fallbacks so a rare safety decline is retried on another model.
 */
export async function askClaude({ system, messages, effort = "low", maxTokens = 4000, schema }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new RequestError(
      500,
      "missing_key",
      "The server has no ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  const outputConfig = { effort };
  if (schema) outputConfig.format = { type: "json_schema", schema };

  const request = { model: MODEL, max_tokens: maxTokens, system, messages, output_config: outputConfig };

  let response;
  try {
    try {
      response = await getClient().beta.messages.create({
        ...request,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (error) {
      // If the chosen model doesn't accept fallbacks, try once more without them.
      if (!(error instanceof Anthropic.BadRequestError)) throw error;
      console.warn("Retrying without fallbacks:", error.message);
      response = await getClient().messages.create(request);
    }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new RequestError(500, "bad_key", "The API key was rejected. Check ANTHROPIC_API_KEY in Vercel.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new RequestError(429, "rate_limited", "Too many requests right now. Wait a few seconds and try again.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message);
      throw new RequestError(502, "api_error", "The AI service had a problem. Please try again.");
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new RequestError(422, "refusal", "The AI declined to respond to that. Try rephrasing.");
  }

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (schema) {
    try {
      return JSON.parse(text);
    } catch {
      throw new RequestError(502, "bad_output", "The debrief came back incomplete. Please try again.");
    }
  }
  return text;
}

/** Wraps a Vercel function with friendly error replies. */
export function handler(fn) {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST." });
      return;
    }
    try {
      const result = await fn(req.body || {});
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: error.message, code: error.code });
      } else {
        console.error(error);
        res.status(500).json({ error: "Something went wrong on the server." });
      }
    }
  };
}
