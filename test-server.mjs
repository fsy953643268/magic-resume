import { createServer } from "node:http";
import { resolve, normalize } from "node:path";
import { existsSync, statSync, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import serverEntry from "./dist/server/server.js";

const clientDir = resolve(process.cwd(), "dist/client");
const port = 3000;
const host = "127.0.0.1";

console.log("clientDir:", clientDir);
console.log("clientDir exists:", existsSync(clientDir));
console.log("serverEntry type:", typeof serverEntry);
console.log("serverEntry.fetch type:", typeof serverEntry.fetch);

const server = createServer(async (req, res) => {
  console.log("Request:", req.url);
  try {
    const response = await serverEntry.fetch(req);
    console.log("Response status:", response.status);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const body = Readable.fromWeb(response.body);
    body.pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }
});

server.on('error', (err) => {
  console.error('Server error event:', err);
});

server.listen(port, host, () => {
  console.log(`Magic Resume server running at http://${host}:${port}`);
});
