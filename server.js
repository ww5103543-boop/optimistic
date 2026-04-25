const http = require("http");
const https = require("https");
const ws = require("ws");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require("os");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Create HTTP server
const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/games") urlPath = "/games.html";
  if (urlPath === "/terminal") urlPath = "/terminal/index.html";

  const rootAttempt = path.join(__dirname, urlPath);
  const appsAttempt = path.join(__dirname, "apps", urlPath);
  const lithiumAttempt = path.join(__dirname, "lithium-js", urlPath);
  const terminalAttempt = path.join(__dirname, "terminal", urlPath.replace("/terminal/", ""));

  function serveFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    };
    if (ext === ".html") {
      headers["X-Frame-Options"] = "ALLOWALL";
      headers["Content-Security-Policy"] = "frame-ancestors *";
      headers["Cache-Control"] = "no-cache";
    }
    if (ext === ".css" || ext === ".js" || ext === ".mjs") {
      headers["Cache-Control"] = "public, max-age=86400";
    }
    if (ext === ".wasm") {
      headers["Cache-Control"] = "public, max-age=86400";
    }
    if (filePath.includes("sw.js") || filePath.includes("bareworker.js")) {
      headers["Service-Worker-Allowed"] = "/";
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }

  // Check for terminal files first
  if (urlPath.startsWith("/terminal/")) {
    const terminalFile = path.join(__dirname, "terminal", urlPath.replace("/terminal/", ""));
    if (fs.existsSync(terminalFile) && fs.statSync(terminalFile).isFile()) {
      serveFile(terminalFile);
      return;
    }
  }

  if (fs.existsSync(rootAttempt) && fs.statSync(rootAttempt).isFile()) {
    serveFile(rootAttempt);
  } else if (
    fs.existsSync(lithiumAttempt) &&
    fs.statSync(lithiumAttempt).isFile()
  ) {
    serveFile(lithiumAttempt);
  } else if (
    fs.existsSync(appsAttempt) &&
    fs.statSync(appsAttempt).isFile()
  ) {
    serveFile(appsAttempt);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + urlPath);
  }
});

// WebSocket server for terminal
const wss = new ws.Server({ server });
let terminalSessions = new Map();

console.log("\x1b[36m╔════════════════════════════════════════╗\x1b[0m");
console.log("\x1b[36m║     Optimistic OS Terminal Backend     ║\x1b[0m");
console.log("\x1b[36m╚════════════════════════════════════════╝\x1b[0m");

wss.on("connection", (ws, req) => {
  const sessionId = Date.now() + Math.random();
  let currentDir = os.homedir();
  let shellProcess = null;
  let isAlive = true;

  console.log(`\x1b[32m✓\x1b[0m Terminal connected: ${sessionId}`);

  ws.send(JSON.stringify({
    type: "ready",
    data: `Connected to Optimistic OS Terminal\nType 'help' for commands\n`
  }));

  // Spawn bash shell
  shellProcess = spawn(process.platform === "win32" ? "cmd.exe" : "/bin/bash", [], {
    cwd: currentDir,
    env: process.env,
    shell: true
  });

  shellProcess.stdout.on("data", (data) => {
    if (isAlive) {
      ws.send(JSON.stringify({
        type: "output",
        data: data.toString()
      }));
    }
  });

  shellProcess.stderr.on("data", (data) => {
    if (isAlive) {
      ws.send(JSON.stringify({
        type: "output",
        data: data.toString()
      }));
    }
  });

  shellProcess.on("close", (code) => {
    console.log(`\x1b[33m⚠\x1b[0m Shell exited with code ${code}`);
    if (isAlive) {
      ws.send(JSON.stringify({
        type: "output",
        data: `\n\x1b[31mShell terminated with code ${code}\x1b[0m\n`
      }));
    }
  });

  ws.on("message", (message) => {
    const data = message.toString();
    
    if (data === "__GET_CWD__") {
      ws.send(JSON.stringify({
        type: "cwd",
        data: currentDir
      }));
      return;
    }
    
    if (data.startsWith("__CD__:")) {
      const newDir = data.substring(7);
      try {
        process.chdir(newDir);
        currentDir = process.cwd();
        if (shellProcess) {
          shellProcess.kill();
          shellProcess = spawn(process.platform === "win32" ? "cmd.exe" : "/bin/bash", [], {
            cwd: currentDir,
            env: process.env,
            shell: true
          });
          // Reattach listeners
          shellProcess.stdout.on("data", (d) => {
            if (isAlive) ws.send(JSON.stringify({ type: "output", data: d.toString() }));
          });
          shellProcess.stderr.on("data", (d) => {
            if (isAlive) ws.send(JSON.stringify({ type: "output", data: d.toString() }));
          });
        }
        ws.send(JSON.stringify({
          type: "cwd",
          data: currentDir
        }));
      } catch (err) {
        ws.send(JSON.stringify({
          type: "output",
          data: `cd: ${err.message}\n`
        }));
      }
      return;
    }
    
    if (shellProcess && shellProcess.stdin) {
      shellProcess.stdin.write(data + "\n");
    }
  });

  ws.on("close", () => {
    isAlive = false;
    if (shellProcess) {
      shellProcess.kill();
    }
    terminalSessions.delete(sessionId);
    console.log(`\x1b[31m✗\x1b[0m Terminal disconnected: ${sessionId}`);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error: ${err.message}`);
  });

  terminalSessions.set(sessionId, { ws, shell: shellProcess });
});

server.listen(PORT, HOST, () => {
  console.log(`\x1b[32m✓\x1b[0m HTTP server running at http://${HOST}:${PORT}`);
  console.log(`\x1b[32m✓\x1b[0m WebSocket server running on ws://${HOST}:${PORT}`);
  console.log(`\x1b[36m➜\x1b[0m Terminal available at http://${HOST}:${PORT}/terminal`);
});
