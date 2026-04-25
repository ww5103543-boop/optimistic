const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Terminal connected');
  let currentDir = os.homedir();
  
  ws.on('message', (data) => {
    const { cmd, cwd } = JSON.parse(data);
    
    if (cmd === 'cd') {
      try {
        process.chdir(cwd);
        currentDir = process.cwd();
        ws.send(JSON.stringify({ output: '', cwd: currentDir }));
      } catch(e) {
        ws.send(JSON.stringify({ output: e.message, cwd: currentDir }));
      }
      return;
    }
    
    exec(cmd, { cwd: currentDir }, (error, stdout, stderr) => {
      ws.send(JSON.stringify({
        output: error ? stderr : stdout,
        cwd: currentDir
      }));
    });
  });
});

console.log('Terminal backend running on ws://localhost:8080');
