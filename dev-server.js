// Local preview server, so you can try the app on your own computer.
// Run:  npm run dev   (real AI, needs ANTHROPIC_API_KEY in a .env file)
//  or:  npm run demo  (canned replies, no key needed)
// On Vercel this file is not used: Vercel serves /public and /api by itself.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

// Load a .env file if present (KEY=value per line).
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const routes = {
  "/api/employee": (await import("./api/employee.js")).default,
  "/api/coach": (await import("./api/coach.js")).default,
  "/api/debrief": (await import("./api/debrief.js")).default,
  "/api/voice": (await import("./api/voice.js")).default,
};

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const route = routes[url.pathname];
    if (route) {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try {
        req.body = raw ? JSON.parse(raw) : {};
      } catch {
        req.body = {};
      }
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };
      res.send = (data) => res.end(data);
      return route(req, res);
    }
    const file = path.join(root, "public", url.pathname === "/" ? "index.html" : url.pathname);
    if (!file.startsWith(path.join(root, "public")) || !fs.existsSync(file)) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  })
  .listen(process.env.PORT || 3000, () => {
    console.log(
      `Hard Conversations Simulator running at http://localhost:${process.env.PORT || 3000}` +
        (process.env.DEMO_MODE === "1" ? "  (demo mode: canned replies)" : "")
    );
  });
