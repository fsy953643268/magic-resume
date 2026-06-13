import { createServer } from "node:http";
import { resolve, normalize } from "node:path";
import { existsSync, statSync, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import serverEntry from "./dist/server/server.js";

const clientDir = resolve(process.cwd(), "dist/client");
const port = 3001;
const host = "127.0.0.1";

console.error("Debug server starting on port", port);
console.error("clientDir:", clientDir, "exists:", existsSync(clientDir));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    console.error("Req:", req.method, url.pathname);
    const response = await serverEntry.fetch(req);
    console.error("Res:", response.status);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    if (req.method === "HEAD" || !response.body) {
      res.end();
      return;
    }
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error("ERR:", err.message, err.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Error");
    }
  }
});

server.on('error', (e) => {
  console.error("Listen error:", e.message);
});

server.listen(port, host, () => {
  console.error(`Magic Resume on http://${host}:${port}`);
});
