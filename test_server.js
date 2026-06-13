const http = require("node:http");
const req = http.get("http://localhost:3000/", (res) => {
  console.log("Status:", res.statusCode);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => console.log("Body:", data.substring(0, 500)));
});
req.on("error", (e) => console.error("Error:", e.message));
setTimeout(() => { console.log("Timeout"); process.exit(0); }, 5000);