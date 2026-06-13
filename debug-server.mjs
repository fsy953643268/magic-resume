import { resolve, normalize } from "node:path";
import { existsSync, statSync, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import serverEntry from "./dist/server/server.js";

const clientDir = resolve(process.cwd(), "dist/client");
const port = 3000;
const hostname = "127.0.0.1";

console.log("Starting Magic Resume server...");
console.log("cwd:", process.cwd());
console.log("clientDir:", clientDir);
console.log("exists:", existsSync(clientDir));
console.log("port:", port);
console.log("host:", hostname);
console.log("serverEntry.fetch:", typeof serverEntry.fetch);

function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function appendSetCookie(res, value) {
  const existing = res.getHeader("set-cookie");
  if (!existing) {
    res.setHeader("set-cookie", value);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("set-cookie", [...existing, value]);
    return;
  }
  res.setHeader("set-cookie", [String(existing), value]);
}

const { createServer } = await import("node:http");

const server = createServer(async (req, res) => {
  try {
    const hostHeader = req.headers.host || `127.0.0.1:${port}`;
    const protocol = (req.headers["x-forwarded-proto"] || "http").toString().split(",")[0].trim();
    const url = new URL(req.url || "/", `${protocol}://${hostHeader}`);

    // Skip static serving - let SSR handle it
    const method = (req.method || "GET").toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const init = { method, headers: toHeaders(req.headers) };
    if (hasBody) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }

    const request = new Request(url, init);
    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        appendSetCookie(res, value);
      } else {
        res.setHeader(key, value);
      }
    });

    if (method === "HEAD" || !response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
});

server.on('error', (err) => {
  console.error('Listen error:', err);
});

server.listen(port, hostname, () => {
  console.log(`Magic Resume server running at http://${hostname}:${port}`);
});
