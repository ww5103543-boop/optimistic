const http = require("http");
const https = require("https");
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

function serveFile(filePath, res) {
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

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  // Terminal route - serve clean terminal HTML (no scramjet)
  if (urlPath === "/terminal" || urlPath === "/terminal/") {
    const terminalPath = path.join(__dirname, "terminal.html");
    if (fs.existsSync(terminalPath)) {
      serveFile(terminalPath, res);
      return;
    }
  }

  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/games") urlPath = "/games.html";
  if (urlPath === "/movies" || urlPath === "/movies/") urlPath = "/movies/index.html";

  const rootAttempt = path.join(__dirname, urlPath);
  const appsAttempt = path.join(__dirname, "apps", urlPath);
  const lithiumAttempt = path.join(__dirname, "lithium-js", urlPath);

  if (fs.existsSync(rootAttempt) && fs.statSync(rootAttempt).isFile()) {
    serveFile(rootAttempt, res);
  } else if (
    fs.existsSync(lithiumAttempt) &&
    fs.statSync(lithiumAttempt).isFile()
  ) {
    serveFile(lithiumAttempt, res);
  } else if (
    fs.existsSync(appsAttempt) &&
    fs.statSync(appsAttempt).isFile()
  ) {
    serveFile(appsAttempt, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + urlPath);
  }
});

// WebSocket for terminal
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // Only handle terminal WebSocket connections
  if (!req.url || req.url !== '/terminal-ws') {
    ws.close();
    return;
  }
  
  let currentDir = os.homedir();
  console.log('Terminal client connected');
  
  const shell = spawn('/bin/bash', ['-l'], {
    cwd: currentDir,
    env: { ...process.env, TERM: 'xterm-256color', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
  });
  
  shell.stdout.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
  });
  
  shell.stderr.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'output', data: `\x1b[31m${data.toString()}\x1b[0m` }));
  });
  
  ws.on('message', (msg) => {
    const cmd = msg.toString();
    if (cmd === '__cwd__') {
      ws.send(JSON.stringify({ type: 'cwd', data: currentDir }));
    } else if (cmd.startsWith('__cd__:')) {
      const newDir = cmd.substring(7).replace('~', os.homedir());
      try {
        process.chdir(newDir);
        currentDir = process.cwd();
        ws.send(JSON.stringify({ type: 'cwd', data: currentDir }));
      } catch(e) {}
    } else {
      shell.stdin.write(cmd + '\n');
    }
  });
  
  ws.on('close', () => {
    shell.kill();
    console.log('Terminal client disconnected');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Terminal available at http://${HOST}:${PORT}/terminal`);
});
